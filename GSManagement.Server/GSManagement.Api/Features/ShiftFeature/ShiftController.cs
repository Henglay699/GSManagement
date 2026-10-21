using GSManagement.Api.Features.ShiftFeature.DTOs;
using GSManagement.Domain.Entities.Enums;
using JwtTest.Middlewares.CheckPermission;
using Microsoft.AspNetCore.Mvc;

namespace GSManagement.Api.Features.ShiftFeature;

[ApiController]
[Route("api/shifts")]
public class ShiftController(IShiftService shiftService) : ControllerBase
{
    private readonly IShiftService _shiftService = shiftService;

    [HttpGet]
    [HasPermission(AppPermission.ViewShift)]
    public async Task<ActionResult<List<ShiftDto>>> GetAll()
    {
        var shifts = await _shiftService.GetAllAsync();
        return Ok(shifts);
    }

    [HttpGet("default")]
    [HasPermission(AppPermission.ViewShift)]
    public async Task<ActionResult<ShiftDto>> GetDefault()
    {
        var shift = await _shiftService.GetDefaultShiftAsync();
        return shift is null ? NotFound(new { message = "No default shift found." }) : Ok(shift);
    }

    [HttpGet("{id:int}")]
    [HasPermission(AppPermission.ViewShift)]
    public async Task<ActionResult<ShiftDto>> GetById(int id)
    {
        var shift = await _shiftService.GetByIdAsync(id);
        return shift is null ? NotFound(new { message = $"Shift {id} not found." }) : Ok(shift);
    }

    [HttpPost]
    [HasPermission(AppPermission.CreateShift)]
    public async Task<ActionResult<ShiftDto>> Create([FromBody] CreateShiftDto dto)
    {
        var created = await _shiftService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    [HasPermission(AppPermission.UpdateShift)]
    public async Task<ActionResult<ShiftDto>> Update(int id, [FromBody] UpdateShiftDto dto)
    {
        var updated = await _shiftService.UpdateAsync(id, dto);
        return updated is null ? NotFound(new { message = $"Shift {id} not found." }) : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    [HasPermission(AppPermission.DeleteShift)]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _shiftService.DeleteAsync(id);
        return success ? NoContent() : NotFound(new { message = $"Shift {id} not found." });
    }
}
