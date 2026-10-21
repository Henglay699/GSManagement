namespace GSManagement.Api.Features.ShiftFeature.DTOs;

public record ShiftDto(
    int Id,
    string Name,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int GraceMinutes,
    bool IsDefault
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
