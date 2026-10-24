using GSManagement.Api.Extentions;
using GSManagement.Api.Hubs;
using GSManagement.Api.Shared.Email;
using GSManagement.Api.Shared.Storage;
using GSManagement.Domain.DB;
using JwtTest.Middlewares.CSRF;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
    
// Add services to the container.
builder.Services.AddControllers(options =>
    {
        // CSRF check on every unsafe request; see ValidateAntiForgeryTokenFilter.
        options.Filters.AddService<ValidateAntiForgeryTokenFilter>();
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddSwaggerConfig();
builder.Services.AddSignalR();
builder.Services.AddMemoryCache();

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
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddJwtAuthServices(builder.Configuration);

// Cloudflare R2 credentials: keep the keys in user-secrets, not appsettings.json
builder.Services.Configure<R2Options>(builder.Configuration.GetSection(R2Options.SectionName));
// SMTP for password-reset and email-change mails: keep the password in user-secrets
builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection(SmtpOptions.SectionName));

// Add application services
builder.Services.AddApplicationServices(builder.Environment);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    await app.SeedData();
    app.MapOpenApi().AllowAnonymous();
    app.UseSwaggerConfig();
    // app.UseHttpsRedirection();
}
// await app.SeedData();
// app.UseSwaggerConfig();

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
//add Hub 
app.UseHubServices();
app.Run();