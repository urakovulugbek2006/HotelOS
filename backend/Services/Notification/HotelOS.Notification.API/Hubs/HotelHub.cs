using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HotelOS.Notification.API.Hubs;

/// <summary>
/// SignalR hub — clients connect here and join channels.
/// Channels:
///   "rooms"           — all searching guests subscribe, receive room status updates
///   "user:{userId}"   — personal channel for booking/payment confirmations
///   "kitchen"         — kitchen staff subscribe, receive new order notifications
///   "server"          — server/waiter staff, receive delivery assignments
/// </summary>
[Authorize]
public class HotelHub : Hub
{
    /// <summary>Client calls this after connecting to join a channel.</summary>
    public async Task JoinChannel(string channel)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, channel);
    }

    /// <summary>Client calls this to leave a channel.</summary>
    public async Task LeaveChannel(string channel)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, channel);
    }

    public override async Task OnConnectedAsync()
    {
        // auto-join personal channel based on JWT sub claim
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");

        await base.OnConnectedAsync();
    }
}