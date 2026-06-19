import axios from "axios";
import { Depth, Trade, Balance, Order } from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "";

export const api = {
  // Market data
  getDepth:   () => axios.get<Depth>(`${BASE}/market/depth`).then(r => r.data),
  getTrades:  () => axios.get<Trade[]>(`${BASE}/market/trades`).then(r => r.data),
  getTicker:  () => axios.get<{ price: number }>(`${BASE}/market/ticker`).then(r => r.data),
  getBalance: () => axios.get<Balance>(`${BASE}/market/balance`).then(r => r.data),

  // Orders
  placeOrder: (data: {
    side: string; type: string; price?: number; quantity: number; market: string;
  }) => axios.post<{ orderId: string; fills: any[]; executedQty: number }>(`${BASE}/order`, data).then(r => r.data),

  getMyOrders:   () => axios.get<Order[]>(`${BASE}/order`).then(r => r.data),
  cancelOrder:   (id: string) => axios.delete(`${BASE}/order/${id}`).then(r => r.data),
};
