import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { engine } from "../engine/matching";
import { prisma } from "../db/client";

const router = Router();

// All order routes require auth
router.use(authMiddleware);

// POST /order — place a new order
router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { side, type, price, quantity, market } = req.body;
    const userId = req.user!.userId;

    if (!side || !type || !quantity || !market) {
      res.status(400).json({ error: "side, type, quantity, market are required" });
      return;
    }
    if (!["BUY", "SELL"].includes(side)) {
      res.status(400).json({ error: "side must be BUY or SELL" });
      return;
    }
    if (!["LIMIT", "MARKET"].includes(type)) {
      res.status(400).json({ error: "type must be LIMIT or MARKET" });
      return;
    }
    if (type === "LIMIT" && !price) {
      res.status(400).json({ error: "price is required for LIMIT orders" });
      return;
    }
    if (quantity <= 0) {
      res.status(400).json({ error: "quantity must be positive" });
      return;
    }

    const result = await engine.placeOrder({ userId, side, type, price, quantity, market });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /order — get my orders
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// DELETE /order/:id — cancel an open order
router.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });

    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    if (order.userId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }
    if (order.status === "FILLED" || order.status === "CANCELLED") {
      res.status(400).json({ error: `Cannot cancel a ${order.status} order` });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });

      // Unlock balance
      const remaining = order.quantity - order.filled;
      if (order.side === "BUY" && order.price) {
        await tx.balance.update({
          where: { userId_asset: { userId: order.userId, asset: "INR" } },
          data: { available: { increment: order.price * remaining }, locked: { decrement: order.price * remaining } },
        });
      } else if (order.side === "SELL") {
        await tx.balance.update({
          where: { userId_asset: { userId: order.userId, asset: "TATA" } },
          data: { available: { increment: remaining }, locked: { decrement: remaining } },
        });
      }
    });

    res.json({ message: "Order cancelled successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

export default router;
