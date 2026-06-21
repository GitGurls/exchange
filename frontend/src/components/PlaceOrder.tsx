import { useState } from "react";
import { Side, OrderType, Balance } from "../types";
import { api } from "../hooks/useApi";

interface Props {
  balance: Balance | null;
  lastPrice: number;
  onOrderPlaced: (qty: number, side: Side) => void;
}

export function PlaceOrder({ balance, lastPrice, onOrderPlaced }: Props) {
  const [side,    setSide]    = useState<Side>("BUY");
  const [type,    setType]    = useState<OrderType>("LIMIT");
  const [price,   setPrice]   = useState(lastPrice.toString());
  const [qty,     setQty]     = useState("10");
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState<{ text: string; ok: boolean } | null>(null);

  const total = Number(type === "LIMIT" ? price : lastPrice) * Number(qty);
  const inr = balance?.INR?.available ?? 0;
  const tata = balance?.TATA?.available ?? 0;

  const submit = async () => {
    setLoading(true); setMsg(null);
    try {
      const result = await api.placeOrder({
        side, type, quantity: Number(qty), market: "TATA_INR",
        ...(type === "LIMIT" ? { price: Number(price) } : {}),
      });
      setMsg({ text: `✓ ${result.executedQty} qty filled across ${result.fills.length} trade(s)`, ok: true });
      onOrderPlaced(result.executedQty, side);
    } catch (err: any) {
      setMsg({ text: err.response?.data?.error ?? err.message, ok: false });
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", background: "#0d1520", border: "1px solid #1f2937",
    color: "#e2e8f0", padding: "9px 12px", borderRadius: 6, fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace", boxSizing: "border-box", outline: "none"
  };

  return (
    <div>
      {/* Buy/Sell */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
        {(["BUY", "SELL"] as Side[]).map(s => (
          <button key={s} onClick={() => setSide(s)} style={{
            padding: 10, borderRadius: 6, border: "none", cursor: "pointer",
            fontWeight: 700, fontFamily: "'Inter', sans-serif", fontSize: 13,
            background: side === s ? (s === "BUY" ? "#16a34a" : "#dc2626") : "#1f2937",
            color: side === s ? "#fff" : "#6b7280",
          }}>{s}</button>
        ))}
      </div>

      {/* Limit/Market */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
        {(["LIMIT", "MARKET"] as OrderType[]).map(t => (
          <button key={t} onClick={() => setType(t)} style={{
            padding: 7, borderRadius: 6, border: `1px solid ${type === t ? "#38bdf8" : "#1f2937"}`,
            background: "transparent", color: type === t ? "#38bdf8" : "#4b5563",
            cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500
          }}>{t.charAt(0) + t.slice(1).toLowerCase()}</button>
        ))}
      </div>

      {type === "LIMIT" && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: "#6b7280", fontSize: 11, display: "block", marginBottom: 5 }}>PRICE (₹)</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} style={inp} />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ color: "#6b7280", fontSize: 11, display: "block", marginBottom: 5 }}>QUANTITY</label>
        <input type="number" value={qty} onChange={e => setQty(e.target.value)} style={inp} />
      </div>

      {/* Summary */}
      <div style={{ background: "#0d1520", border: "1px solid #1f2937", borderRadius: 6, padding: "10px 12px", marginBottom: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ color: "#6b7280" }}>Est. Total</span>
          <span style={{ color: "#e2e8f0" }}>₹{total.toLocaleString("en-IN")}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ color: "#6b7280" }}>INR Available</span>
          <span style={{ color: "#4ade80" }}>₹{inr.toLocaleString("en-IN")}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#6b7280" }}>TATA Available</span>
          <span style={{ color: "#38bdf8" }}>{tata} shares</span>
        </div>
       {(balance?.INR?.locked ?? 0) > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ color: "#6b7280" }}>INR Locked</span>
            <span style={{ color: "#f59e0b" }}>₹{(balance?.INR?.locked ?? 0).toLocaleString("en-IN")}</span>
          </div>
        )}
      </div>

      <button onClick={submit} disabled={loading} style={{
        width: "100%", padding: 12, borderRadius: 6, border: "none",
        cursor: loading ? "not-allowed" : "pointer", fontWeight: 700,
        fontFamily: "'Inter', sans-serif", fontSize: 14,
        background: side === "BUY" ? "#16a34a" : "#dc2626",
        color: "#fff", opacity: loading ? 0.7 : 1
      }}>
        {loading ? "Placing..." : `${side} TATA`}
      </button>

      {msg && (
        <div style={{
          marginTop: 10, padding: "8px 12px", borderRadius: 6, fontSize: 12,
          background: msg.ok ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
          color: msg.ok ? "#4ade80" : "#f87171",
          fontFamily: "'JetBrains Mono', monospace"
        }}>{msg.text}</div>
      )}
    </div>
  );
}
