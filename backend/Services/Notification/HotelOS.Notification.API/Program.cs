using System.Text;
using HotelOS.Notification.API.Consumers;
using HotelOS.Notification.API.Hubs;
using HotelOS.Notification.Core.Interfaces;
using HotelOS.Notification.Core.Services;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, cfg) =>
{
    cfg.ReadFrom.Configuration(ctx.Configuration).WriteTo.Console();
    if (!ctx.HostingEnvironment.IsProduction())
        cfg.WriteTo.File("logs/notification-.log", rollingInterval: RollingInterval.Day);
});

// ── SignalR ───────────────────────────────────────────────────
builder.Services.AddSignalR();

// ── Notification Service ──────────────────────────────────────
builder.Services.AddScoped<INotificationService, NotificationService>();

// ── MassTransit + RabbitMQ ────────────────────────────────────
builder.Services.AddMassTransit(x =>
{
    // register all consumers
    x.AddConsumer<RoomStatusUpdatedConsumer>();
    x.AddConsumer<ReservationCreatedConsumer>();
    x.AddConsumer<ReservationExpiredConsumer>();
    x.AddConsumer<RoomVacatedConsumer>();
    x.AddConsumer<OrderCreatedConsumer>();
    x.AddConsumer<OrderUpdatedConsumer>();
    x.AddConsumer<PaymentConfirmedConsumer>();
    x.AddConsumer<BookingStatusUpdatedConsumer>();

    x.UsingRabbitMq((ctx, cfg) =>
    {
        cfg.Host(builder.Configuration["RabbitMQ:Uri"]);
        cfg.UseMessageRetry(r => r.Intervals(
            TimeSpan.FromSeconds(5),
            TimeSpan.FromSeconds(15),
            TimeSpan.FromSeconds(30)));
        cfg.ConfigureEndpoints(ctx);
    });
});

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

        // SignalR passes JWT as query string — extract it here
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
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
    options.AddPolicy("FrontendPolicy", policy =>
        policy
            .SetIsOriginAllowed(origin =>
            {
                // Allow local dev, any Vercel preview/production, and any Azure Web App
                var host = new Uri(origin).Host;
                return host == "localhost" ||
                       host.EndsWith(".vercel.app") ||
                       host.EndsWith(".azurewebsites.net");
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials())); // required for SignalR

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseSerilogRequestLogging();
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

// ── SignalR hub endpoint ──────────────────────────────────────
app.MapHub<HotelHub>("/hotelHub");

app.Run();