import { Depth } from "../types";

interface Props { depth: Depth; lastPrice: number }

export function OrderBook({ depth, lastPrice }: Props) {
  const maxBid = Math.max(...depth.bids.map(b => b.quantity), 1);
  const maxAsk = Math.max(...depth.asks.map(a => a.quantity), 1);
  const topAsks = [...depth.asks].slice(0, 8).reverse();
  const topBids = depth.bids.slice(0, 8);
  const spread = depth.asks[0] && depth.bids[0]
    ? (depth.asks[0].price - depth.bids[0].price).toFixed(2) : "—";

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", color: "#4b5563", padding: "4px 8px", marginBottom: 6, fontSize: 11, borderBottom: "1px solid #1f2937", paddingBottom: 8 }}>
        <span>PRICE (₹)</span><span style={{ textAlign: "right" }}>QTY</span>
      </div>

      {topAsks.map((a, i) => (
        <div key={i} style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", padding: "3px 8px", color: "#f87171" }}>
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${(a.quantity / maxAsk) * 100}%`, background: "rgba(248,113,113,0.08)" }} />
          <span style={{ position: "relative" }}>{a.price.toLocaleString("en-IN")}</span>
          <span style={{ textAlign: "right", position: "relative" }}>{a.quantity}</span>
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 8px", borderTop: "1px solid #1f2937", borderBottom: "1px solid #1f2937", margin: "4px 0", background: "#0d1520" }}>
        <span style={{ color: "#38bdf8", fontSize: 16, fontWeight: 700 }}>₹{lastPrice.toLocaleString("en-IN")}</span>
        <span style={{ color: "#4b5563", fontSize: 11 }}>Spread ₹{spread}</span>
      </div>

      {topBids.map((b, i) => (
        <div key={i} style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", padding: "3px 8px", color: "#4ade80" }}>
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${(b.quantity / maxBid) * 100}%`, background: "rgba(74,222,128,0.08)" }} />
          <span style={{ position: "relative" }}>{b.price.toLocaleString("en-IN")}</span>
          <span style={{ textAlign: "right", position: "relative" }}>{b.quantity}</span>
        </div>
      ))}
    </div>
  );
}
