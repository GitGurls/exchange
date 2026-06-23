import { useState, useEffect, useRef } from "react";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Area, AreaChart, Cell
} from "recharts";

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Props {
  lastPrice: number;
}

// Custom Candlestick Bar
const CandlestickBar = (props: any) => {
  const { x, y, width, height, open, close, high, low, index } = props;
  if (!open || !close || !high || !low) return null;

  const isBullish = close >= open;
  const color = isBullish ? "#4ade80" : "#f87171";
  const barX = x + width / 2;

  const yScale = props.yScale;
  if (!yScale) return null;

  const highY  = yScale(high);
  const lowY   = yScale(low);
  const openY  = yScale(open);
  const closeY = yScale(close);
  const bodyTop    = Math.min(openY, closeY);
  const bodyHeight = Math.max(Math.abs(closeY - openY), 2);

  return (
    <g>
      {/* Wick */}
      <line x1={barX} y1={highY} x2={barX} y2={lowY}
        stroke={color} strokeWidth={1.5} />
      {/* Body */}
      <rect x={x + 2} y={bodyTop} width={width - 4}
        height={bodyHeight} fill={color} rx={1} />
    </g>
  );
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, chartType }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div style={{
      background: "#1e293b", border: "1px solid #334155",
      borderRadius: 8, padding: "10px 14px",
      fontFamily: "'JetBrains Mono', monospace", fontSize: 12
    }}>
      <div style={{ color: "#94a3b8", marginBottom: 6 }}>{d.time}</div>
      {chartType === "candle" ? (
        <>
          {[
            ["O", d.open, "#94a3b8"],
            ["H", d.high, "#4ade80"],
            ["L", d.low,  "#f87171"],
            ["C", d.close, d.close >= d.open ? "#4ade80" : "#f87171"],
          ].map(([label, val, color]) => (
            <div key={label as string} style={{ display: "flex", justifyContent: "space-between", gap: 16, color: color as string }}>
              <span>{label}</span>
              <span>₹{(val as number).toLocaleString("en-IN")}</span>
            </div>
          ))}
        </>
      ) : (
        <div style={{ color: "#38bdf8" }}>₹{d.close?.toLocaleString("en-IN")}</div>
      )}
    </div>
  );
};

export function PriceChart({ lastPrice }: Props) {
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const [candles, setCandles] = useState<Candle[]>([]);
  const currentCandle = useRef<Candle | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
  };

  // Initialize with 30 seed candles
  useEffect(() => {
    const seed: Candle[] = [];
    let price = lastPrice;
    const now = Date.now();

    for (let i = 29; i >= 0; i--) {
      const open  = price + (Math.random() - 0.5) * 4;
      const close = open  + (Math.random() - 0.5) * 6;
      const high  = Math.max(open, close) + Math.random() * 3;
      const low   = Math.min(open, close) - Math.random() * 3;

      const t = new Date(now - i * 3000);
      seed.push({
        time: t.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low:  parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.floor(Math.random() * 100 + 10),
      });
      price = close;
    }
    setCandles(seed);

    // Start current candle
    currentCandle.current = {
      time: formatTime(),
      open: lastPrice, high: lastPrice,
      low: lastPrice, close: lastPrice,
      volume: 0,
    };
  }, []);

  // Update every second with lastPrice
  useEffect(() => {
    if (!currentCandle.current) return;

    const c = currentCandle.current;
    c.close  = lastPrice;
    c.high   = Math.max(c.high, lastPrice);
    c.low    = Math.min(c.low,  lastPrice);
    c.volume += Math.floor(Math.random() * 10);
    c.time   = formatTime();

    setCandles(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1] = { ...c };
      }
      return updated;
    });

    // Every 5 seconds — new candle
    intervalRef.current = setInterval(() => {
      if (!currentCandle.current) return;
      const prev = currentCandle.current;
      const newCandle: Candle = {
        time: formatTime(),
        open: prev.close, high: prev.close,
        low: prev.close, close: prev.close,
        volume: 0,
      };
      currentCandle.current = newCandle;
      setCandles(old => [...old.slice(-49), newCandle]);
    }, 5000);

    return () => clearInterval(intervalRef.current);
  }, [lastPrice]);

  const minPrice = Math.min(...candles.map(c => c.low))  - 5;
  const maxPrice = Math.max(...candles.map(c => c.high)) + 5;
  const latest   = candles[candles.length - 1];
  const isUp     = latest ? latest.close >= latest.open : true;
  const changeVal = candles.length > 1
    ? (latest?.close ?? 0) - (candles[0]?.open ?? 0)
    : 0;
  const changePct = candles[0]?.open
    ? ((changeVal / candles[0].open) * 100).toFixed(2)
    : "0.00";

  return (
    <div style={{
      background: "#111827", border: "1px solid #1f2937",
      borderRadius: 10, padding: 16
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700,
              color: isUp ? "#4ade80" : "#f87171" }}>
              ₹{lastPrice.toLocaleString("en-IN")}
            </span>
            <span style={{ marginLeft: 10, fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
              color: isUp ? "#4ade80" : "#f87171" }}>
              {changeVal >= 0 ? "+" : ""}{changeVal.toFixed(2)} ({changePct}%)
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#4ade80" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80",
              display: "inline-block", animation: "pulse 1s infinite" }} />
            LIVE
          </div>
        </div>

        {/* Toggle */}
        <div style={{ display: "flex", gap: 6 }}>
          {(["candle", "line"] as const).map(t => (
            <button key={t} onClick={() => setChartType(t)} style={{
              padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer",
              background: chartType === t ? "#1e3a5f" : "#1f2937",
              color: chartType === t ? "#38bdf8" : "#6b7280",
              fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600
            }}>
              {t === "candle" ? "🕯 Candle" : "📈 Line"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        {chartType === "line" ? (
          <AreaChart data={candles} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fill: "#4b5563", fontSize: 9 }}
              tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={[minPrice, maxPrice]} tick={{ fill: "#4b5563", fontSize: 9 }}
              tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} width={55} />
            <Tooltip content={<CustomTooltip chartType="line" />} />
            <Area type="monotone" dataKey="close" stroke="#38bdf8" strokeWidth={2}
              fill="url(#priceGrad)" dot={false} animationDuration={300} />
          </AreaChart>
        ) : (
          <ComposedChart data={candles} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <XAxis dataKey="time" tick={{ fill: "#4b5563", fontSize: 9 }}
              tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={[minPrice, maxPrice]} tick={{ fill: "#4b5563", fontSize: 9 }}
              tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} width={55} />
            <Tooltip content={<CustomTooltip chartType="candle" />} />
            <Bar dataKey="close" shape={<CandlestickBar />} isAnimationActive={false}>
              {candles.map((c, i) => (
                <Cell key={i} fill={c.close >= c.open ? "#4ade80" : "#f87171"} />
              ))}
            </Bar>
          </ComposedChart>
        )}
      </ResponsiveContainer>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
