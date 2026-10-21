using GSManagement.Api.Hubs;

namespace GSManagement.Api.Extentions;

public static class HubService
{
    public static WebApplication UseHubServices(this WebApplication app)
    {
        app.MapHub<UserHub>("/api/userhub");
        return app;
    }
}
