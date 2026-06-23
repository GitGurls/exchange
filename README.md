# TradeX — Production Trading Exchange

Full-stack production-grade trading exchange. Zerodha-style order matching engine with PostgreSQL persistence, JWT auth, real-time WebSockets, and live candlestick charts.

🔗 **Live Demo:** [exchange-black.vercel.app](https://exchange-black.vercel.app)

## Stack

- **Backend:** Node.js + TypeScript + Express + Prisma + PostgreSQL + WebSockets + JWT
- **Frontend:** React + Vite + TypeScript + Recharts
- **Database:** PostgreSQL (Supabase)
- **Deploy:** Render (backend) + Vercel (frontend)

## Features

- ✅ Real order matching engine (limit & market orders)
- ✅ Partial fills — unfilled remainder stays in book
- ✅ Balance locking (available vs locked) — like real exchanges
- ✅ JWT authentication (register/login)
- ✅ Order cancellation with balance unlock
- ✅ WebSocket real-time order book + trades
- ✅ Live candlestick & line price chart

## Quick Start

### 1. Database (Supabase — free)
1. Go to [supabase.com](https://supabase.com) → New Project
2. Connect → ORM tab → copy both `DATABASE_URL` and `DIRECT_URL`

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in DATABASE_URL, DIRECT_URL, JWT_SECRET

npx prisma db push   # Create tables
npm run dev          # Start on :3000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Set VITE_API_URL and VITE_WS_URL

npm run dev          # Start on :5173
```

## Deploy

### Backend → Render
1. Push repo to GitHub
2. New Web Service → Root Directory: `backend`
3. Build: `npm install && npx prisma generate && npm run build`
4. Start: `npm start`
5. Env vars: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `FRONTEND_URL`

### Frontend → Vercel
1. Import repo → Root Directory: `frontend`
2. Framework: Vite
3. Env vars:
   - `VITE_API_URL` = `https://your-backend.onrender.com`
   - `VITE_WS_URL` = `wss://your-backend.onrender.com/ws`

## API Reference

### Auth
```
POST /auth/register   { email, password, name }
POST /auth/login      { email, password }
GET  /auth/me         (Bearer token)
```

### Orders (Bearer token required)
```
POST   /order    { side, type, price?, quantity, market }
GET    /order    → my orders
DELETE /order/:id → cancel order
```

### Market Data
```
GET /market/depth    → orderbook bids/asks
GET /market/trades   → recent fills
GET /market/ticker   → last price
GET /market/balance  → my balances (auth required)
GET /health          → server status
```

## Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
