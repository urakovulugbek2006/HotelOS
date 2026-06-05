import * as signalR from "@microsoft/signalr";

// Production URL is the default — matches how API_BASE is handled in api.ts.
// Override with NEXT_PUBLIC_SIGNALR_URL for local dev.
const HUB_URL =
  process.env.NEXT_PUBLIC_SIGNALR_URL ??
  "https://hotelos-notification.azurewebsites.net/hotelHub";

let connection: signalR.HubConnection | null = null;

export function getHubConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () =>
          localStorage.getItem("hotelos_token") ?? "",
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.ServerSentEvents |
          signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }
  return connection;
}

export async function startConnection(): Promise<signalR.HubConnection> {
  const conn = getHubConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    await conn.start();
  }
  return conn;
}

export async function stopConnection(): Promise<void> {
  if (connection?.state !== signalR.HubConnectionState.Disconnected) {
    await connection?.stop();
  }
}

export async function joinChannel(channel: string): Promise<void> {
  const conn = await startConnection();
  await conn.invoke("JoinChannel", channel);
}

export async function leaveChannel(channel: string): Promise<void> {
  const conn = getHubConnection();
  if (conn.state === signalR.HubConnectionState.Connected) {
    await conn.invoke("LeaveChannel", channel);
  }
}
