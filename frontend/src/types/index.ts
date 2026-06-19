export type Side = "BUY" | "SELL";
export type OrderType = "LIMIT" | "MARKET";
export type OrderStatus = "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Balance {
  [asset: string]: { available: number; locked: number };
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface Depth {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export interface Trade {
  id: string;
  price: number;
  quantity: number;
  timestamp: string;
}

export interface Order {
  id: string;
  side: Side;
  type: OrderType;
  price: number | null;
  quantity: number;
  filled: number;
  status: OrderStatus;
  createdAt: string;
}

export type WSMessage =
  | { type: "CONNECTED"; data: { message: string } }
  | { type: "DEPTH_UPDATE"; data: Depth }
  | { type: "TRADE"; data: Trade }
  | { type: "TICKER"; data: { price: number; symbol: string } }
  | { type: "ORDER_UPDATE"; data: { orderId: string; status: OrderStatus; filled: number } };
