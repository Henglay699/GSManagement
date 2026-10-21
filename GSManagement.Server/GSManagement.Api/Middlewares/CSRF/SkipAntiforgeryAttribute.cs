namespace JwtTest.Middlewares.CSRF;

// Opts an action out of the global ValidateAntiForgeryTokenFilter.
// Only for endpoints that run before the client has a CSRF token (login, refresh).
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class SkipAntiforgeryAttribute : Attribute;
