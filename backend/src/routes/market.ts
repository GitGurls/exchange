import { Router, Request, Response } from "express";
import { engine } from "../engine/matching";
import { prisma } from "../db/client";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /market/depth — current orderbook
router.get("/depth", (_req: Request, res: Response) => {
  res.json(engine.getDepth());
});

// GET /market/trades — recent fills
router.get("/trades", async (_req: Request, res: Response): Promise<void> => {
  try {
    const fills = await prisma.fill.findMany({
      orderBy: { timestamp: "desc" },
      take: 30,
    });
    res.json(fills);
  } catch {
    res.status(500).json({ error: "Failed to fetch trades" });
  }
});

// GET /market/ticker — last price
router.get("/ticker", (_req: Request, res: Response) => {
  res.json({ price: engine.getLastPrice(), symbol: "TATA" });
});

// GET /market/balance — my balances (requires auth)
router.get("/balance", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const balances = await prisma.balance.findMany({
      where: { userId: req.user!.userId },
    });

    const formatted = balances.reduce((acc, b) => {
      acc[b.asset] = { available: b.available, locked: b.locked };
      return acc;
    }, {} as Record<string, { available: number; locked: number }>);

    res.json(formatted);
  } catch {
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

export default router;
