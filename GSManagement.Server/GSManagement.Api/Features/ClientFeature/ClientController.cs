using System.Security.Claims;
using GSManagement.Api.Features.ClientFeature.DTOs;
using GSManagement.Api.Shared.Models;
using GSManagement.Domain.Entities.Enums;
using JwtTest.Middlewares.CheckPermission;
using Microsoft.AspNetCore.Mvc;

namespace GSManagement.Api.Features.ClientFeature;

/// <summary>
/// Clients (factories). Operators work with their own clients only; whoever has ViewAllClients
/// (the Operations Manager, CEO, Admin) sees every client and, with AssignClient, decides who
/// handles which one.
/// </summary>
[ApiController]
[Route("api/clients")]
public class ClientController(IClientService clientService) : ControllerBase
{
    // OnTokenValidated rejects tokens without a numeric NameIdentifier claim.
    private ClientViewer Viewer => new(
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!),
        Has(AppPermission.ViewAllClients),
        Has(AppPermission.AssignClient));

    private bool Has(AppPermission p) => User.HasClaim(UserAccessCache.PermissionClaimType, p.ToString());

    [HttpGet]
    [HasPermission(AppPermission.ViewClient)]
    public async Task<ActionResult<PagedResult<ClientDto>>> GetAll([FromQuery] ClientQuery query, CancellationToken ct) =>
        Ok(await clientService.GetAllAsync(Viewer, query, ct));

    [HttpGet("{id:int}")]
    [HasPermission(AppPermission.ViewClient)]
    public async Task<ActionResult<ClientDto>> GetById(int id, CancellationToken ct) =>
        ToAction(await clientService.GetByIdAsync(Viewer, id, ct));

    [HttpPost]
    [HasPermission(AppPermission.CreateClient)]
    public async Task<ActionResult<ClientDto>> Create([FromBody] SaveClientDto dto, CancellationToken ct)
    {
        var result = await clientService.CreateAsync(Viewer, dto, ct);
        if (!result.IsSuccess) return ToAction(result);
        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id:int}")]
    [HasPermission(AppPermission.UpdateClient)]
    public async Task<ActionResult<ClientDto>> Update(int id, [FromBody] SaveClientDto dto, CancellationToken ct) =>
        ToAction(await clientService.UpdateAsync(Viewer, id, dto, ct));

    /// <summary>Deactivates the client (its history stays).</summary>
    [HttpDelete("{id:int}")]
    [HasPermission(AppPermission.DeleteClient)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var result = await clientService.DeactivateAsync(Viewer, id, ct);
        if (result.IsSuccess) return NoContent();
        return result.ErrorType switch
        {
            ErrorType.NotFound => NotFound(new { error = result.ErrorMessage }),
            ErrorType.Unauthorized => StatusCode(StatusCodes.Status403Forbidden, new { error = result.ErrorMessage }),
            _ => BadRequest(new { error = result.ErrorMessage }),
        };
    }

    /// <summary>Sets the client's primary operator and backups.</summary>
    [HttpPut("{id:int}/operators")]
    [HasPermission(AppPermission.AssignClient)]
    public async Task<ActionResult<ClientDto>> AssignOperators(int id, [FromBody] AssignOperatorsDto dto, CancellationToken ct) =>
        ToAction(await clientService.AssignOperatorsAsync(Viewer, id, dto, ct));

    /// <summary>Staff who can be assigned to clients, with their current client counts.</summary>
    [HttpGet("operators")]
    [HasPermission(AppPermission.ViewAllClients)]
    public async Task<ActionResult<List<OperatorOptionDto>>> GetOperators(CancellationToken ct) =>
        Ok(await clientService.GetOperatorsAsync(ct));

    private ActionResult<ClientDto> ToAction(Result<ClientDto> result)
    {
        if (result.IsSuccess) return Ok(result.Value);
        return result.ErrorType switch
        {
            ErrorType.NotFound => NotFound(new { error = result.ErrorMessage }),
            ErrorType.Conflict => Conflict(new { error = result.ErrorMessage }),
            ErrorType.Unauthorized => StatusCode(StatusCodes.Status403Forbidden, new { error = result.ErrorMessage }),
            _ => BadRequest(new { error = result.ErrorMessage }),
        };
    }
}
