using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, cfg) =>
{
    cfg.ReadFrom.Configuration(ctx.Configuration).WriteTo.Console();
    if (!ctx.HostingEnvironment.IsProduction())
        cfg.WriteTo.File("logs/gateway-.log", rollingInterval: RollingInterval.Day);
});

// ── Load ocelot.json ──────────────────────────────────────────
builder.Configuration
    .SetBasePath(builder.Environment.ContentRootPath)
    .AddJsonFile("ocelot.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"ocelot.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

// ── JWT Authentication ─────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(
                                           Encoding.UTF8.GetBytes(jwtKey))
        };

        // support SignalR token via query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) &&
                    path.StartsWithSegments("/hotelHub"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
    options.AddPolicy("FrontendPolicy", policy =>
        policy
            .SetIsOriginAllowed(origin =>
            {
                var host = new Uri(origin).Host;
                return host == "localhost" ||
                       host.EndsWith(".vercel.app") ||
                       host.EndsWith(".azurewebsites.net");
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()));

// ── Ocelot ────────────────────────────────────────────────────
builder.Services.AddOcelot(builder.Configuration);

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseWebSockets();
app.UseCors("FrontendPolicy");

// Handle /health and / before Ocelot consumes the pipeline
app.Use(async (ctx, next) =>
{
    if (ctx.Request.Path == "/health")
    {
        ctx.Response.ContentType = "application/json";
        await ctx.Response.WriteAsync("{\"status\":\"healthy\"}");
        return;
    }
    if (ctx.Request.Path == "/")
    {
        ctx.Response.Redirect("/health");
        return;
    }
    await next();
});

app.UseAuthentication();
app.UseAuthorization();

await app.UseOcelot();
app.Run();