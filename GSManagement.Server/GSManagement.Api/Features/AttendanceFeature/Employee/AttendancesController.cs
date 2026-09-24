using Microsoft.AspNetCore.Mvc;

namespace GSManagement.Api.Features.AttendanceFeature.Employee;

[ApiController]
[Route("api/[controller]")]
public class AttendancesController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok();
    }
}
