namespace GSManagement.Api.Features.ShiftFeature.DTOs;

public record ShiftDto(
    int Id,
    string Name,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int GraceMinutes,
    bool IsDefault,
    // Active employees working this shift (the default shift counts everyone not assigned elsewhere).
    int EmployeeCount = 0
);

public record CreateShiftDto(
    string Name,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int GraceMinutes,
    bool IsDefault
);

public record UpdateShiftDto(
    string Name,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int GraceMinutes,
    bool IsDefault
);

/// <summary>An active employee and the shift they work, for the assign screen.</summary>
public record ShiftAssignmentDto(
    int UserId,
    string UserName,
    string Email,
    string? ImageUrl,
    string Roles,
    // The shift they work: their own, or the default shift when none is assigned.
    int? ShiftId
);

/// <summary>Body for PUT /api/shifts/{id}/employees: everyone who should work the shift.</summary>
public record AssignShiftEmployeesDto(List<int> UserIds);
