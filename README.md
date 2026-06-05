# HotelOS

A hotel management platform built on a microservices architecture.

## Tech Stack

**Backend:** .NET 8, ASP.NET Core, C#  
**Frontend:** Next.js, Tailwind CSS  
**Database:** PostgreSQL (Neon — one DB per service)  
**Message Broker:** RabbitMQ (CloudAMQP)  
**Real-time:** SignalR (WebSocket)  
**Deployment:** Render (backend), Vercel (frontend)

## Architecture

- Microservices — each service owns its database, no cross-service DB access
- All inter-service communication via RabbitMQ (pub/sub, no direct calls)
- API Gateway as single entry point with JWT validation
- WebSocket push via Notification Service subscribing to broker events

## Services

| Service | Port | Database | Status |
|---------|------|----------|--------|
| Identity | 5001 | hotelos_identity | ✅ Complete |
| Reception | 5002 | hotelos_reception | ✅ Complete |
| Payment | 5003 | hotelos_payment | ✅ Complete |
| RoomService | 5004 | hotelos_roomservice | ✅ Complete |
| Housekeeping | 5005 | hotelos_housekeeping | ✅ Complete |
| Maintenance | 5006 | hotelos_maintenance | ✅ Complete |
| Notification | 5007 | — (stateless) | ✅ Complete |

## Key Design Decisions

**Date-range availability** — rooms are not marked Reserved/Confirmed as a status flag. Availability is determined by querying all active bookings and checking for date overlaps including cleaning and maintenance buffer time between stays.

**StaffProfile separation** — Account handles authentication only. Personal/HR data (name, phone, address) lives in StaffProfile, linked by accountId. Client keeps inline personal fields since guest profile needs differ from HR needs.

**10-minute payment window** — on reservation creation, ExpiresAt is set to now+10min. A background job scans for PendingPayment bookings past ExpiresAt and marks them TimedOut, releasing the room.

**Buffer config** — each room has a RoomBufferConfig (cleaningBufferMins default 120, maintenanceBufferMins default 240). EffectiveCheckout = checkOut + buffer. Next booking cannot start before effectiveCheckout.

## Running Locally

Each service runs independently. Start Identity first as all others depend on JWT validation.

```bash
cd backend
dotnet run --project Services/Identity/HotelOS.Identity.API     # port 5001
dotnet run --project Services/Reception/HotelOS.Reception.API   # port 5002
```

Swagger UI available at `http://localhost:{port}/swagger`

## Environment Variables

Each service requires `appsettings.Development.json` (gitignored):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "your_neon_connection_string"
  },
  "RabbitMQ": {
    "Uri": "your_cloudamqp_uri"
  },
  "Jwt": {
    "Key": "min_32_char_secret",
    "Issuer": "HotelOS",
    "Audience": "HotelOS",
    "ExpiryMinutes": "60"
  }
}
```
