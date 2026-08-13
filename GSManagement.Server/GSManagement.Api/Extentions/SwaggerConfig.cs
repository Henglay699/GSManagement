using NSwag;
using NSwag.Generation.Processors.Security;

namespace GSManagement.Api.Extentions;

public static class SwaggerConfig
{
    public static IServiceCollection AddSwaggerConfig(this IServiceCollection services)
    {
        services.AddOpenApiDocument(option =>
        {
            option.Title = "GSManagement";
            option.Version = "v1";
            option.Description = "GSManagement API";
            option.DocumentName = "v1";
            option.AddSecurity("Bearer", new OpenApiSecurityScheme
            {
                Description = "Bearer token authorization header",
                Type = OpenApiSecuritySchemeType.Http,
                In = OpenApiSecurityApiKeyLocation.Header,
                Name = "Authorization",
                Scheme = "Bearer"
            });
            option.OperationProcessors.Add(new AspNetCoreOperationSecurityScopeProcessor("Bearer"));
        });

        return services;
    }

    public static WebApplication UseSwaggerConfig(this WebApplication webApplication)
    {
        webApplication.UseOpenApi();

        webApplication.UseSwaggerUi();

        return webApplication;
    }
}