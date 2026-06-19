import { v4 as uuidv4 } from "uuid";
import { prisma } from "../db/client";
import { EngineOrder, Fill, Depth, Side } from "../types";
import { wsServer } from "../ws/server";

export class OrderMatchingEngine {
  private bids: EngineOrder[] = []; // sorted highest first
  private asks: EngineOrder[] = []; // sorted lowest first

  // ─── Place Order ──────────────────────────────────────────────────────────

  async placeOrder(params: {
    userId: string;
    side: Side;
    type: "LIMIT" | "MARKET";
    price?: number;
    quantity: number;
    market: string;
  }): Promise<{ orderId: string; fills: Fill[]; executedQty: number }> {
    const { userId, side, type, quantity, market } = params;
    let price = params.price ?? 0;

    if (type === "MARKET") {
      price = side === "BUY"
        ? (this.asks[0]?.price ?? 0)
        : (this.bids[0]?.price ?? 0);
      if (price === 0) throw new Error("No liquidity available for market order");
    }

    // Validate & lock balance in DB
    await this.lockBalance(userId, side, price, quantity);

    // Save order to DB
    const dbOrder = await prisma.order.create({
      data: {
        userId,
        market,
        side,
        type,
        price: type === "LIMIT" ? price : null,
        quantity,
        filled: 0,
        status: "OPEN",
      },
    });

    const engineOrder: EngineOrder = {
      id: dbOrder.id,
      userId,
      side,
      type,
      price,
      quantity,
      filled: 0,
    };

    // Match against book
    const fills = await this.matchOrder(engineOrder);
    const executedQty = fills.reduce((s, f) => s + f.quantity, 0);

    // Add remainder to book for limit orders
    if (type === "LIMIT" && engineOrder.filled < engineOrder.quantity) {
      this.addToBook(engineOrder);
    }

    // Broadcast depth update to all WS clients
    wsServer.broadcast({ type: "DEPTH_UPDATE", data: this.getDepth() });

    return { orderId: dbOrder.id, fills, executedQty };
  }

  // ─── Matching Logic ───────────────────────────────────────────────────────

  private async matchOrder(order: EngineOrder): Promise<Fill[]> {
    const fills: Fill[] = [];

    if (order.side === "BUY") {
      while (this.asks.length > 0 && order.filled < order.quantity) {
        const bestAsk = this.asks[0];
        if (order.type === "LIMIT" && order.price < bestAsk.price) break;

        const fillQty = Math.min(order.quantity - order.filled, bestAsk.quantity - bestAsk.filled);
        await this.executeFill(order, bestAsk, fillQty, bestAsk.price, fills);

        if (bestAsk.filled >= bestAsk.quantity) this.asks.shift();
      }
    } else {
      while (this.bids.length > 0 && order.filled < order.quantity) {
        const bestBid = this.bids[0];
        if (order.type === "LIMIT" && order.price > bestBid.price) break;

        const fillQty = Math.min(order.quantity - order.filled, bestBid.quantity - bestBid.filled);
        await this.executeFill(bestBid, order, fillQty, bestBid.price, fills);

        if (bestBid.filled >= bestBid.quantity) this.bids.shift();
      }
    }

    return fills;
  }

  private async executeFill(
    buyOrder: EngineOrder,
    sellOrder: EngineOrder,
    qty: number,
    price: number,
    fills: Fill[]
  ) {
    buyOrder.filled  += qty;
    sellOrder.filled += qty;

    const fill: Fill = {
      price,
      quantity: qty,
      tradeId: uuidv4(),
      timestamp: Date.now(),
      buyOrderId: buyOrder.id,
      sellOrderId: sellOrder.id,
    };
    fills.push(fill);

    // Persist fill + update balances + update order statuses in one transaction
    await prisma.$transaction(async (tx) => {
      // Save fill
      await tx.fill.create({
        data: {
          id: fill.tradeId,
          market: "TATA_INR",
          price,
          quantity: qty,
          buyOrderId: buyOrder.id,
          sellOrderId: sellOrder.id,
        },
      });

      // Buyer: deduct INR (already locked), credit TATA
      await tx.balance.upsert({
        where: { userId_asset: { userId: buyOrder.userId, asset: "TATA" } },
        update: { available: { increment: qty } },
        create: { userId: buyOrder.userId, asset: "TATA", available: qty },
      });
      await tx.balance.update({
        where: { userId_asset: { userId: buyOrder.userId, asset: "INR" } },
        data: { locked: { decrement: price * qty } },
      });

      // Seller: deduct TATA (already locked), credit INR
      await tx.balance.upsert({
        where: { userId_asset: { userId: sellOrder.userId, asset: "INR" } },
        update: { available: { increment: price * qty } },
        create: { userId: sellOrder.userId, asset: "INR", available: price * qty },
      });
      await tx.balance.update({
        where: { userId_asset: { userId: sellOrder.userId, asset: "TATA" } },
        data: { locked: { decrement: qty } },
      });

      // Update order statuses
      const buyStatus = buyOrder.filled >= buyOrder.quantity ? "FILLED" : "PARTIALLY_FILLED";
      const sellStatus = sellOrder.filled >= sellOrder.quantity ? "FILLED" : "PARTIALLY_FILLED";

      await tx.order.update({ where: { id: buyOrder.id },  data: { filled: buyOrder.filled,  status: buyStatus } });
      await tx.order.update({ where: { id: sellOrder.id }, data: { filled: sellOrder.filled, status: sellStatus } });
    });

    // Broadcast trade to WS clients
    wsServer.broadcast({ type: "TRADE", data: fill });
    wsServer.broadcast({ type: "TICKER", data: { price, symbol: "TATA" } });
  }

  // ─── Book Management ──────────────────────────────────────────────────────

  private addToBook(order: EngineOrder) {
    if (order.side === "BUY") {
      this.bids.push(order);
      this.bids.sort((a, b) => b.price - a.price);
    } else {
      this.asks.push(order);
      this.asks.sort((a, b) => a.price - b.price);
    }
  }

  // ─── Balance Lock/Unlock ──────────────────────────────────────────────────

  private async lockBalance(userId: string, side: Side, price: number, quantity: number) {
    if (side === "BUY") {
      const required = price * quantity;
      const bal = await prisma.balance.findUnique({
        where: { userId_asset: { userId, asset: "INR" } },
      });
      if (!bal || bal.available < required)
        throw new Error(`Insufficient INR. Available: ₹${bal?.available ?? 0}, Required: ₹${required}`);

      await prisma.balance.update({
        where: { userId_asset: { userId, asset: "INR" } },
        data: { available: { decrement: required }, locked: { increment: required } },
      });
    } else {
      const bal = await prisma.balance.findUnique({
        where: { userId_asset: { userId, asset: "TATA" } },
      });
      if (!bal || bal.available < quantity)
        throw new Error(`Insufficient TATA. Available: ${bal?.available ?? 0}, Required: ${quantity}`);

      await prisma.balance.update({
        where: { userId_asset: { userId, asset: "TATA" } },
        data: { available: { decrement: quantity }, locked: { increment: quantity } },
      });
    }
  }

  // ─── Public Getters ───────────────────────────────────────────────────────

  getDepth(): Depth {
    const aggregate = (orders: EngineOrder[]) => {
      const map = new Map<number, number>();
      for (const o of orders) {
        const rem = o.quantity - o.filled;
        if (rem > 0) map.set(o.price, (map.get(o.price) ?? 0) + rem);
      }
      return Array.from(map.entries()).map(([price, quantity]) => ({ price, quantity }));
    };

    return {
      bids: aggregate(this.bids).sort((a, b) => b.price - a.price),
      asks: aggregate(this.asks).sort((a, b) => a.price - b.price),
    };
  }

  getLastPrice(): number {
    return this.asks[0]?.price ?? this.bids[0]?.price ?? 3841;
  }

  // Seed initial liquidity (call once on startup)
 // Seed initial liquidity (call once on startup)
  async seedLiquidity(userId: string) {
    const base = 3841;
    const levels = [
      { price: base + 1,  qty: 50,  side: "SELL" as Side },
      { price: base + 3,  qty: 120, side: "SELL" as Side },
      { price: base + 6,  qty: 80,  side: "SELL" as Side },
      { price: base + 10, qty: 200, side: "SELL" as Side },
      { price: base + 15, qty: 150, side: "SELL" as Side },
      { price: base - 1,  qty: 60,  side: "BUY" as Side },
      { price: base - 4,  qty: 140, side: "BUY" as Side },
      { price: base - 8,  qty: 90,  side: "BUY" as Side },
      { price: base - 12, qty: 180, side: "BUY" as Side },
      { price: base - 18, qty: 110, side: "BUY" as Side },
    ];

    for (const { price, qty, side } of levels) {
      // Create the order in DB first so foreign keys resolve correctly
      const dbOrder = await prisma.order.create({
        data: {
          userId,
          market: "TATA_INR",
          side,
          type: "LIMIT",
          price,
          quantity: qty,
          filled: 0,
          status: "OPEN",
        },
      });

      const order: EngineOrder = {
        id: dbOrder.id, userId, side, type: "LIMIT",
        price, quantity: qty, filled: 0,
      };
      this.addToBook(order);
    }
  }
}
// Singleton engine instance
export const engine = new OrderMatchingEngine();
