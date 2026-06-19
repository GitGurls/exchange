import { Order } from "../types";
import { api } from "../hooks/useApi";

interface Props {
  orders: Order[];
  onCancelled: () => void;
}

const statusColor: Record<string, string> = {
  OPEN: "#38bdf8",
  PARTIALLY_FILLED: "#f59e0b",
  FILLED: "#4ade80",
  CANCELLED: "#6b7280",
};

export function MyOrders({ orders, onCancelled }: Props) {
  const cancel = async (id: string) => {
    try {
      await api.cancelOrder(id);
      onCancelled();
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Failed to cancel");
    }
  };

  if (orders.length === 0) {
    return <div style={{ color: "#374151", textAlign: "center", padding: 20, fontSize: 13 }}>No orders yet</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
        <thead>
          <tr style={{ color: "#6b7280", borderBottom: "1px solid #1f2937" }}>
            {["SIDE", "TYPE", "PRICE", "QTY", "FILLED", "STATUS", ""].map(h => (
              <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} style={{ borderBottom: "1px solid #0f172a" }}>
              <td style={{ padding: "6px 8px", color: o.side === "BUY" ? "#4ade80" : "#f87171" }}>{o.side}</td>
              <td style={{ padding: "6px 8px", color: "#9ca3af" }}>{o.type}</td>
              <td style={{ padding: "6px 8px", color: "#e2e8f0" }}>{o.price ? `₹${o.price.toLocaleString("en-IN")}` : "MKT"}</td>
              <td style={{ padding: "6px 8px", color: "#e2e8f0" }}>{o.quantity}</td>
              <td style={{ padding: "6px 8px", color: "#9ca3af" }}>{o.filled}</td>
              <td style={{ padding: "6px 8px", color: statusColor[o.status] ?? "#fff" }}>{o.status.replace("_", " ")}</td>
              <td style={{ padding: "6px 8px" }}>
                {(o.status === "OPEN" || o.status === "PARTIALLY_FILLED") && (
                  <button onClick={() => cancel(o.id)} style={{
                    background: "transparent", border: "1px solid #374151", color: "#f87171",
                    padding: "2px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11
                  }}>Cancel</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
