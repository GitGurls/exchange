import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { Server } from "http";
import { WSMessage } from "../types";

class ExchangeWSServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  init(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      console.log(`WS client connected. Total: ${this.clients.size + 1}`);
      this.clients.add(ws);

      // Send current depth on connect
      ws.send(JSON.stringify({ type: "CONNECTED", data: { message: "Connected to TradeX exchange" } }));

      ws.on("close", () => {
        this.clients.delete(ws);
        console.log(`WS client disconnected. Total: ${this.clients.size}`);
      });

      ws.on("error", (err) => {
        console.error("WS error:", err);
        this.clients.delete(ws);
      });
    });

    console.log("WebSocket server initialized on /ws");
  }

  broadcast(message: WSMessage) {
    if (this.clients.size === 0) return;

    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  getClientCount() {
    return this.clients.size;
  }
}

export const wsServer = new ExchangeWSServer();
