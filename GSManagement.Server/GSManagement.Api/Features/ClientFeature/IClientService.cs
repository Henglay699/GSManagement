using GSManagement.Api.Features.ClientFeature.DTOs;
using GSManagement.Api.Shared.Models;

namespace GSManagement.Api.Features.ClientFeature;

public interface IClientService
{
    Task<PagedResult<ClientDto>> GetAllAsync(ClientViewer viewer, ClientQuery query, CancellationToken ct);
    Task<Result<ClientDto>> GetByIdAsync(ClientViewer viewer, int id, CancellationToken ct);
    Task<Result<ClientDto>> CreateAsync(ClientViewer viewer, SaveClientDto dto, CancellationToken ct);
    Task<Result<ClientDto>> UpdateAsync(ClientViewer viewer, int id, SaveClientDto dto, CancellationToken ct);
    Task<Result> DeactivateAsync(ClientViewer viewer, int id, CancellationToken ct);
    Task<Result<ClientDto>> AssignOperatorsAsync(ClientViewer viewer, int id, AssignOperatorsDto dto, CancellationToken ct);
    Task<List<OperatorOptionDto>> GetOperatorsAsync(CancellationToken ct);
}
