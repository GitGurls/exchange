import { useEffect, useRef, useCallback, useState } from "react";
import { Depth, Trade, WSMessage } from "../types";

interface UseExchangeWSOptions {
  onDepthUpdate?: (depth: Depth) => void;
  onTrade?: (trade: Trade) => void;
  onTickerUpdate?: (price: number) => void;
}

export function useExchangeWS({ onDepthUpdate, onTrade, onTickerUpdate }: UseExchangeWSOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const isUnmounted = useRef(false);

  // Keep latest callbacks in refs so we don't need them in the effect deps
  const callbacksRef = useRef({ onDepthUpdate, onTrade, onTickerUpdate });
  callbacksRef.current = { onDepthUpdate, onTrade, onTickerUpdate };

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const WS_URL = import.meta.env.VITE_WS_URL ?? `ws://localhost:3000/ws`;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (isUnmounted.current) { ws.close(); return; }
      setConnected(true);
      console.log("WS connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        const cb = callbacksRef.current;
        switch (msg.type) {
          case "DEPTH_UPDATE": cb.onDepthUpdate?.(msg.data); break;
          case "TRADE":        cb.onTrade?.(msg.data as any); break;
          case "TICKER":       cb.onTickerUpdate?.(msg.data.price); break;
        }
      } catch (e) {
        console.error("WS parse error:", e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (isUnmounted.current) return;
      console.log("WS disconnected — reconnecting in 3s...");
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

 useEffect(() => {
    isUnmounted.current = false;
    connect();

    return () => {
      isUnmounted.current = true;
      clearTimeout(reconnectTimer.current);

      // Delay the actual close — if this was just StrictMode's
      // fake unmount, the next mount will flip isUnmounted back
      // to false before this timeout fires, so we skip closing.
      setTimeout(() => {
        if (isUnmounted.current) {
          wsRef.current?.close();
        }
      }, 100);
    };
  }, [connect]);

  return { connected };
}