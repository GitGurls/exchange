# TradeX v2 — Production Trading Exchange

Full-stack production-grade trading exchange. Zerodha-style order matching engine with PostgreSQL persistence, JWT auth, and real-time WebSockets.


## Stack

- **Backend**: Node.js + TypeScript + Express + Prisma + PostgreSQL + WebSockets + JWT
- **Frontend**: React + Vite + TypeScript
- **Database**: PostgreSQL (Supabase free tier)
- **Deploy**: Render (backend) + Vercel (frontend)

## Quick Start

### 1. Database Setup (Supabase — free)
1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy the **Connection String** (URI format)
3. Paste into `backend/.env` as `DATABASE_URL`

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET in .env

npx prisma db push      # Create tables
npm run dev             # Start server on :3000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev             # Start on :5173
```

## Deploy

### Backend → Render
1. Push `backend/` to GitHub
2. New Web Service → connect repo
3. Build: `npm install && npx prisma generate && npm run build`
4. Start: `npx prisma migrate deploy && npm start`
5. Add env vars: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import to Vercel, framework: Vite
3. Add env vars:
   - `VITE_API_URL` = your Render URL (e.g. `https://tradex-backend.onrender.com`)
   - `VITE_WS_URL` = `wss://tradex-backend.onrender.com/ws`

## API Reference

### Auth
```
POST /auth/register   { email, password, name }
POST /auth/login      { email, password }
GET  /auth/me         (Bearer token)
```

### Orders (all require Bearer token)
```
POST   /order         { side, type, price?, quantity, market }
GET    /order         → my orders list
DELETE /order/:id     → cancel order
```

### Market Data (public)
```
GET /market/depth     → orderbook bids/asks
GET /market/trades    → recent fills
GET /market/ticker    → last price
GET /market/balance   → my balances (auth required)
```

## Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
