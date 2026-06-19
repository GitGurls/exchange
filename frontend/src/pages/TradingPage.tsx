import { useState, useEffect, useCallback } from "react";
import { Depth, Trade, Balance, Order, Side } from "../types";
import { api } from "../hooks/useApi";
import { useExchangeWS } from "../hooks/useExchangeWS";
import { useAuth } from "../context/AuthContext";
import { OrderBook } from "../components/OrderBook";
import { PlaceOrder } from "../components/PlaceOrder";
import { MyOrders } from "../components/MyOrders";

export function TradingPage() {
  const { user, logout } = useAuth();
  const [depth,     setDepth]     = useState<Depth>({ bids: [], asks: [] });
  const [trades,    setTrades]    = useState<Trade[]>([]);
  const [balance,   setBalance]   = useState<Balance | null>(null);
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [lastPrice, setLastPrice] = useState(3841);
  const [tab,       setTab]       = useState<"trades" | "orders">("trades");
  const [toast,     setToast]     = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [d, t, b, o, ticker] = await Promise.all([
        api.getDepth(), api.getTrades(), api.getBalance(), api.getMyOrders(), api.getTicker()
      ]);
      setDepth(d); setTrades(t as any); setBalance(b); setOrders(o); setLastPrice(ticker.price);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // WebSocket real-time updates
  const { connected } = useExchangeWS({
    onDepthUpdate: setDepth,
    onTrade: (t) => setTrades(prev => [t as any, ...prev.slice(0, 29)]),
    onTickerUpdate: setLastPrice,
  });

  const handleOrderPlaced = (qty: number, side: Side) => {
    const action = side === "BUY" ? "Bought" : "Sold";
    setToast(`${action} ${qty} shares`);
    setTimeout(() => setToast(null), 3500);
    fetchAll();
  };

  const col: React.CSSProperties = {
    background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 16
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" }}>
      {/* Navbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #1f2937", background: "#0d1520" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18, color: "#38bdf8" }}>TradeX</span>
          <span style={{ background: "#1e3a5f", color: "#38bdf8", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>TATA/INR</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: "#38bdf8" }}>
            ₹{lastPrice.toLocaleString("en-IN")}
          </span>
          <span style={{ fontSize: 11, color: connected ? "#4ade80" : "#f87171", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "#4ade80" : "#f87171", display: "inline-block" }} />
            {connected ? "LIVE" : "CONNECTING"}
          </span>
          <span style={{ color: "#6b7280", fontSize: 13 }}>Hi, {user?.name}</span>
          <button onClick={logout} style={{ background: "transparent", border: "1px solid #374151", color: "#9ca3af", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
            Logout
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 68, right: 20, zIndex: 1000, background: "#16a34a", color: "#fff", padding: "10px 18px", borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
          ✓ {toast}
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 290px", gap: 14, padding: 14, maxWidth: 1400, margin: "0 auto" }}>

        {/* Orderbook */}
        <div style={col}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Order Book</div>
          <OrderBook depth={depth} lastPrice={lastPrice} />
        </div>

        {/* Center */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Stats bar */}
          <div style={{ ...col, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
            {[
              { label: "Best Bid",  value: depth.bids[0] ? `₹${depth.bids[0].price.toLocaleString("en-IN")}` : "—", color: "#4ade80" },
              { label: "Spread",    value: depth.asks[0] && depth.bids[0] ? `₹${(depth.asks[0].price - depth.bids[0].price).toFixed(2)}` : "—", color: "#38bdf8" },
              { label: "Best Ask",  value: depth.asks[0] ? `₹${depth.asks[0].price.toLocaleString("en-IN")}` : "—", color: "#f87171" },
              { label: "24h Trades", value: trades.length.toString(), color: "#e2e8f0" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ ...col, flex: 1 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {(["trades", "orders"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                  background: tab === t ? "#1e3a5f" : "transparent",
                  color: tab === t ? "#38bdf8" : "#6b7280",
                  fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                  textTransform: "capitalize"
                }}>
                  {t === "trades" ? `Recent Trades (${trades.length})` : `My Orders (${orders.length})`}
                </button>
              ))}
            </div>

            {tab === "trades" ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", color: "#6b7280", fontSize: 11, padding: "4px 8px", marginBottom: 4 }}>
                  <span>PRICE (₹)</span><span style={{ textAlign: "center" }}>QTY</span><span style={{ textAlign: "right" }}>TIME</span>
                </div>
                {trades.length === 0 && <div style={{ color: "#374151", textAlign: "center", padding: 20, fontSize: 13 }}>No trades yet</div>}
                {trades.map((t: any, i) => {
                  const prev = trades[i + 1] as any;
                  const isBuy = !prev || t.price >= prev.price;
                  return (
                    <div key={t.id ?? t.tradeId ?? i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "4px 8px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: isBuy ? "#4ade80" : "#f87171", borderBottom: "1px solid #0d1520" }}>
                      <span>{t.price.toLocaleString("en-IN")}</span>
                      <span style={{ textAlign: "center" }}>{t.quantity}</span>
                      <span style={{ textAlign: "right", color: "#6b7280", fontSize: 11 }}>
                        {new Date(t.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </>
            ) : (
              <MyOrders orders={orders} onCancelled={fetchAll} />
            )}
          </div>

          {/* Balance */}
          {balance && (
            <div style={{ ...col, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {Object.entries(balance).map(([asset, b]) => (
                <div key={asset}>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{asset}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: asset === "INR" ? "#4ade80" : "#38bdf8" }}>
                    {asset === "INR" ? `₹${b.available.toLocaleString("en-IN")}` : `${b.available} shares`}
                  </div>
                  {b.locked > 0 && <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 2 }}>🔒 {asset === "INR" ? `₹${b.locked.toLocaleString("en-IN")}` : `${b.locked}`} locked</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Place Order */}
        <div style={col}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Place Order</div>
          <PlaceOrder balance={balance} lastPrice={lastPrice} onOrderPlaced={handleOrderPlaced} />
        </div>
      </div>

      <style>{`* { box-sizing: border-box; } body { margin: 0; } input[type=number] { -moz-appearance: textfield; } input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 2px; }`}</style>
    </div>
  );
}
