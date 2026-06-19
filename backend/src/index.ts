import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import http from "http";
import { wsServer } from "./ws/server";
import { engine } from "./engine/matching";
import { prisma } from "./db/client";
import authRoutes   from "./routes/auth";
import orderRoutes  from "./routes/order";
import marketRoutes from "./routes/market";

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// Rate limiting — 100 requests per 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later" },
}));

// ─── Routes ───────────────────────────────────────────────────────────────

app.use("/auth",   authRoutes);
app.use("/order",  orderRoutes);
app.use("/market", marketRoutes);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    wsClients: wsServer.getClientCount(),
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────

const PORT = process.env.PORT ?? 3000;
const server = http.createServer(app);

// Attach WebSocket server to HTTP server
wsServer.init(server);

server.listen(PORT, async () => {
  console.log(`\n🚀 Exchange server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server on ws://localhost:${PORT}/ws`);
  console.log(`\nRoutes:`);
  console.log(`  POST   /auth/register`);
  console.log(`  POST   /auth/login`);
  console.log(`  GET    /auth/me`);
  console.log(`  POST   /order        (auth required)`);
  console.log(`  GET    /order        (auth required)`);
  console.log(`  DELETE /order/:id    (auth required)`);
  console.log(`  GET    /market/depth`);
  console.log(`  GET    /market/trades`);
  console.log(`  GET    /market/ticker`);
  console.log(`  GET    /market/balance  (auth required)`);

  // Seed liquidity using a system user
  try {
    let systemUser = await prisma.user.findUnique({ where: { email: "system@tradex.com" } });
    if (!systemUser) {
      const bcrypt = await import("bcryptjs");
      systemUser = await prisma.user.create({
        data: {
          email: "system@tradex.com",
          password: await bcrypt.hash("system-password-not-for-login", 12),
          name: "System",
          balances: {
            create: [
              { asset: "INR",  available: 10000000, locked: 0 },
              { asset: "TATA", available: 10000,    locked: 0 },
            ],
          },
        },
      });
      console.log("\n✅ System user created");
    }
    await engine.seedLiquidity(systemUser.id);
    console.log("✅ Orderbook seeded with initial liquidity");
  } catch (err) {
    console.error("❌ Failed to seed:", err);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});
