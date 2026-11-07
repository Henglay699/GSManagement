using GSManagement.Api.Features.ClientFeature.DTOs;
using GSManagement.Api.Shared.Models;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.ClientFeature;

/// <summary>
/// Clients (factories) and the operators who handle them.
///
/// Rules:
///  - Someone without ViewAllClients sees, opens and edits only the clients they are assigned to.
///  - A client created by such an operator is assigned to them as primary operator.
///  - Only AssignClient (the Operations Manager) changes who handles a client.
///  - Deleting deactivates: a client's history (shipments, invoices) must stay intact.
/// </summary>
public class ClientService(GSDbContext context) : IClientService
{
    private readonly GSDbContext _context = context;

    public async Task<PagedResult<ClientDto>> GetAllAsync(ClientViewer viewer, ClientQuery query, CancellationToken ct)
    {
        var pageSize = Math.Clamp(query.PageSize, 1, 200);
        var pageNumber = Math.Max(1, query.PageNumber);

        var clients = _context.Clients.AsNoTracking().AsQueryable();

        // Operators only ever see their own clients, whatever they ask for.
        var mineOnly = !viewer.SeeAll || string.Equals(query.Scope, "mine", StringComparison.OrdinalIgnoreCase);
        if (mineOnly)
            clients = clients.Where(c => c.Operators.Any(o => o.UserId == viewer.UserId));

        if (viewer.SeeAll && query.OperatorId is int operatorId)
            clients = clients.Where(c => c.Operators.Any(o => o.UserId == operatorId));
        if (viewer.SeeAll && query.Unassigned)
            clients = clients.Where(c => !c.Operators.Any(o => o.IsPrimary));
        if (!query.IncludeInactive)
            clients = clients.Where(c => c.IsActive);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = $"%{query.Search.Trim()}%";
            clients = clients.Where(c =>
                EF.Functions.ILike(c.CompanyName, term) ||
                (c.Code != null && EF.Functions.ILike(c.Code, term)) ||
                EF.Functions.ILike(c.Vat, term) ||
                (c.ContactName != null && EF.Functions.ILike(c.ContactName, term)));
        }

        var total = await clients.CountAsync(ct);
        var page = await clients
            .OrderBy(c => c.CompanyName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Include(c => c.Operators).ThenInclude(o => o.User)
            .AsSplitQuery()
            .ToListAsync(ct);

        return new PagedResult<ClientDto>(page.Select(c => Map(c, viewer.UserId)).ToList(), total, pageNumber, pageSize);
    }

    public async Task<Result<ClientDto>> GetByIdAsync(ClientViewer viewer, int id, CancellationToken ct)
    {
        var client = await LoadAsync(id, ct, tracking: false);
        // Another operator's client looks like it doesn't exist.
        if (client is null || !CanSee(viewer, client))
            return Result<ClientDto>.Fail($"Client {id} not found.", ErrorType.NotFound);
        return Result<ClientDto>.Success(Map(client, viewer.UserId));
    }

    public async Task<Result<ClientDto>> CreateAsync(ClientViewer viewer, SaveClientDto dto, CancellationToken ct)
    {
        var problem = Validate(dto);
        if (problem is not null) return Result<ClientDto>.Fail(problem, ErrorType.Validation);
        var code = Clean(dto.Code)?.ToUpperInvariant();
        if (code is not null && await CodeTakenAsync(code, null, ct))
            return Result<ClientDto>.Fail($"Another client already uses the code {code}.", ErrorType.Conflict);

        var client = new Client { CompanyName = dto.CompanyName.Trim(), Vat = dto.Vat.Trim() };
        Apply(client, dto, code);

        // An operator who adds a client handles it; a manager assigns someone afterwards.
        if (!viewer.SeeAll)
            client.Operators.Add(new ClientOperator
            {
                UserId = viewer.UserId,
                IsPrimary = true,
                AssignedById = viewer.UserId,
            });

        _context.Clients.Add(client);
        await _context.SaveChangesAsync(ct);
        return await GetByIdAsync(viewer, client.Id, ct);
    }

    public async Task<Result<ClientDto>> UpdateAsync(ClientViewer viewer, int id, SaveClientDto dto, CancellationToken ct)
    {
        var client = await LoadAsync(id, ct, tracking: true);
        if (client is null || !CanSee(viewer, client))
            return Result<ClientDto>.Fail($"Client {id} not found.", ErrorType.NotFound);

        var problem = Validate(dto);
        if (problem is not null) return Result<ClientDto>.Fail(problem, ErrorType.Validation);
        var code = Clean(dto.Code)?.ToUpperInvariant();
        if (code is not null && await CodeTakenAsync(code, id, ct))
            return Result<ClientDto>.Fail($"Another client already uses the code {code}.", ErrorType.Conflict);

        client.CompanyName = dto.CompanyName.Trim();
        client.Vat = dto.Vat.Trim();
        Apply(client, dto, code);
        // Only someone who sees every client can switch one off (it disappears from operators' lists).
        if (!viewer.SeeAll) client.IsActive = true;

        await _context.SaveChangesAsync(ct);
        return Result<ClientDto>.Success(Map(client, viewer.UserId));
    }

    public async Task<Result> DeactivateAsync(ClientViewer viewer, int id, CancellationToken ct)
    {
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (client is null) return Result.Fail($"Client {id} not found.", ErrorType.NotFound);
        if (!viewer.SeeAll)
            return Result.Fail("Only the Operations Manager can deactivate a client.", ErrorType.Unauthorized);
        client.IsActive = false;
        await _context.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result<ClientDto>> AssignOperatorsAsync(
        ClientViewer viewer, int id, AssignOperatorsDto dto, CancellationToken ct)
    {
        var client = await LoadAsync(id, ct, tracking: true);
        if (client is null) return Result<ClientDto>.Fail($"Client {id} not found.", ErrorType.NotFound);

        var wanted = new HashSet<int>(dto.BackupUserIds ?? new List<int>());
        if (dto.PrimaryUserId is int primaryId) wanted.Add(primaryId);

        // Everyone assigned must be an active user who can work on clients.
        var eligible = await EligibleOperators()
            .Where(u => wanted.Contains(u.Id))
            .Select(u => u.Id)
            .ToListAsync(ct);
        var refused = wanted.Except(eligible).ToList();
        if (refused.Count > 0)
            return Result<ClientDto>.Fail(
                "Only active staff whose role can update clients can be assigned.", ErrorType.Validation);

        // Replace the assignments; keep the original date for people who stay on.
        var existing = client.Operators.ToDictionary(o => o.UserId);
        foreach (var gone in client.Operators.Where(o => !wanted.Contains(o.UserId)).ToList())
            client.Operators.Remove(gone);

        // Clear the old primary first: the database allows one primary per client.
        foreach (var o in client.Operators) o.IsPrimary = false;
        await _context.SaveChangesAsync(ct);

        foreach (var userId in wanted)
        {
            var isPrimary = userId == dto.PrimaryUserId;
            if (existing.TryGetValue(userId, out var current) && client.Operators.Contains(current))
            {
                current.IsPrimary = isPrimary;
                continue;
            }
            client.Operators.Add(new ClientOperator
            {
                UserId = userId,
                IsPrimary = isPrimary,
                AssignedById = viewer.UserId,
            });
        }
        await _context.SaveChangesAsync(ct);

        var reloaded = await LoadAsync(id, ct, tracking: false);
        return Result<ClientDto>.Success(Map(reloaded!, viewer.UserId));
    }

    public async Task<List<OperatorOptionDto>> GetOperatorsAsync(CancellationToken ct)
    {
        var people = await EligibleOperators()
            .OrderBy(u => u.UserName)
            .Select(u => new
            {
                u.Id,
                u.UserName,
                u.Email,
                u.ImageUrl,
                Roles = u.Roles.Select(r => r.RoleName).ToList(),
            })
            .ToListAsync(ct);

        var counts = await _context.ClientOperators
            .Where(o => o.Client.IsActive)
            .GroupBy(o => new { o.UserId, o.IsPrimary })
            .Select(g => new { g.Key.UserId, g.Key.IsPrimary, Count = g.Count() })
            .ToListAsync(ct);

        return people
            .Select(p => new OperatorOptionDto(
                p.Id,
                p.UserName,
                p.Email,
                p.ImageUrl,
                string.Join(", ", p.Roles),
                counts.Where(c => c.UserId == p.Id && c.IsPrimary).Sum(c => c.Count),
                counts.Where(c => c.UserId == p.Id && !c.IsPrimary).Sum(c => c.Count)))
            .ToList();
    }

    /* ---------------------------------------------------------------------------------- */

    /// <summary>Active users whose roles may update clients.</summary>
    private IQueryable<User> EligibleOperators() =>
        _context.Users.Where(u => u.IsActive && u.Roles.Any(r =>
            r.Permissions.Any(p => p.PermissionName == AppPermission.UpdateClient)));

    private Task<Client?> LoadAsync(int id, CancellationToken ct, bool tracking)
    {
        var q = _context.Clients.Include(c => c.Operators).ThenInclude(o => o.User).AsQueryable();
        if (!tracking) q = q.AsNoTracking();
        return q.FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    private static bool CanSee(ClientViewer viewer, Client client) =>
        viewer.SeeAll || client.Operators.Any(o => o.UserId == viewer.UserId);

    private Task<bool> CodeTakenAsync(string code, int? exceptId, CancellationToken ct) =>
        _context.Clients.AnyAsync(c => c.Code != null && c.Code.ToUpper() == code && c.Id != exceptId, ct);

    private static string? Validate(SaveClientDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CompanyName)) return "Enter the company name.";
        if (dto.CompanyName.Trim().Length > 200) return "The company name is too long.";
        if (string.IsNullOrWhiteSpace(dto.Vat)) return "Enter the VAT TIN.";
        if (dto.Code is { Length: > 20 }) return "Use a short code, up to 20 characters (e.g. JR).";
        if (!string.IsNullOrWhiteSpace(dto.Email) && !dto.Email.Contains('@')) return "Enter a valid email.";
        return null;
    }

    private static string? Clean(string? v) => string.IsNullOrWhiteSpace(v) ? null : v.Trim();

    private static void Apply(Client client, SaveClientDto dto, string? code)
    {
        client.Code = code;
        client.CompanyNameKm = Clean(dto.CompanyNameKm);
        client.Email = Clean(dto.Email);
        client.BusinessType = Clean(dto.BusinessType);
        client.Address = Clean(dto.Address);
        client.ContactName = Clean(dto.ContactName);
        client.Phone = Clean(dto.Phone);
        client.CdcNo = Clean(dto.CdcNo);
        client.CdcValidUntil = dto.CdcValidUntil;
        client.Notes = Clean(dto.Notes);
        client.IsActive = dto.IsActive;
    }

    private static ClientDto Map(Client c, int viewerId) => new(
        c.Id,
        c.Code,
        c.CompanyName,
        c.CompanyNameKm,
        c.Email,
        c.Vat,
        c.BusinessType,
        c.Address,
        c.ContactName,
        c.Phone,
        c.CdcNo,
        c.CdcValidUntil,
        c.Notes,
        c.IsActive,
        c.CreatedAt,
        c.Operators
            .OrderByDescending(o => o.IsPrimary)
            .ThenBy(o => o.User?.UserName)
            .Select(o => new ClientOperatorDto(o.UserId, o.User?.UserName ?? $"User {o.UserId}", o.User?.ImageUrl, o.IsPrimary))
            .ToList(),
        c.Operators.Any(o => o.UserId == viewerId));
}
