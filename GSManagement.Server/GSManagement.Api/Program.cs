using GSManagement.Api.Extentions;
using GSManagement.Api.Hubs;
using GSManagement.Domain.DB;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddSwaggerConfig();
builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://192.168.8.89:5173", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddDbContext<GSDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("SqliteConnection")));

// Add application services
builder.Services.AddApplicationServices();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    await app.SeedData();
    app.MapOpenApi();
    app.UseSwaggerConfig();
    // app.UseHttpsRedirection();
}
// await app.SeedData();
// app.UseSwaggerConfig();

app.UseCors("AllowFrontend");
app.MapControllers();
app.MapHub<UserHub>("/api/userhub");
app.Run();