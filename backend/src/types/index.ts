export type Side = "BUY" | "SELL";
export type OrderType = "LIMIT" | "MARKET";
export type OrderStatus = "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED";

export interface EngineOrder {
  id: string;
  userId: string;
  side: Side;
  type: OrderType;
  price: number;
  quantity: number;
  filled: number;
}

export interface Fill {
  price: number;
  quantity: number;
  tradeId: string;
  timestamp: number;
  buyOrderId: string;
  sellOrderId: string;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface Depth {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

// WebSocket message types
export type WSMessage =
  | { type: "DEPTH_UPDATE"; data: Depth }
  | { type: "TRADE"; data: Fill }
  | { type: "TICKER"; data: { price: number; symbol: string } }
  | { type: "ORDER_UPDATE"; data: { orderId: string; status: OrderStatus; filled: number } };

export interface JWTPayload {
  userId: string;
  email: string;
}
