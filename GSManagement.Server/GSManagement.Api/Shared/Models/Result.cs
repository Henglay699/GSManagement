namespace GSManagement.Api.Shared.Models;

public enum ErrorType
{
    None,
    NotFound,
    Conflict,
    Validation,
    Unauthorized
}
public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public T? Value { get; private set; }
    public string? ErrorMessage { get; private set; }
    public ErrorType ErrorType { get; private set; }

    public static Result<T> Success(T value) =>
        new() { IsSuccess = true, Value = value };

    public static Result<T> Fail(string message, ErrorType type = ErrorType.None) =>
        new() { IsSuccess = false, ErrorMessage = message, ErrorType = type };
}

public class Result
{
    public bool IsSuccess { get; private set; }
    public string? ErrorMessage { get; private set; }
    public ErrorType ErrorType { get; private set; }
    public static Result Success() =>
        new() { IsSuccess = true };

    public static Result Fail(string message, ErrorType type = ErrorType.Validation) =>
        new() { IsSuccess = false, ErrorMessage = message, ErrorType = type };
}
