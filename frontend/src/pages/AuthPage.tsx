import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setError(""); setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        if (!form.name) { setError("Name is required"); setLoading(false); return; }
        await register(form.email, form.password, form.name);
      }
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 14px", background: "#0f172a",
    border: "1px solid #1f2937", borderRadius: 8, color: "#e2e8f0",
    fontSize: 14, fontFamily: "'Inter', sans-serif", boxSizing: "border-box", outline: "none"
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0f1a", display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ width: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: "#38bdf8" }}>
            TradeX
          </div>
          <div style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>
            Production-grade trading exchange
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 28 }}>
          {/* Toggle */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
            {["Login", "Register"].map((label, i) => (
              <button key={label} onClick={() => { setIsLogin(i === 0); setError(""); }} style={{
                padding: "9px", borderRadius: 8, border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 13,
                background: isLogin === (i === 0) ? "#1e3a5f" : "transparent",
                color: isLogin === (i === 0) ? "#38bdf8" : "#6b7280",
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {!isLogin && (
              <div>
                <label style={{ color: "#6b7280", fontSize: 11, display: "block", marginBottom: 6 }}>FULL NAME</label>
                <input style={inp} placeholder="Soni Gupta" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
            )}
            <div>
              <label style={{ color: "#6b7280", fontSize: 11, display: "block", marginBottom: 6 }}>EMAIL</label>
              <input style={inp} type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label style={{ color: "#6b7280", fontSize: 11, display: "block", marginBottom: 6 }}>PASSWORD</label>
              <input style={inp} type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handle()} />
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(248,113,113,0.1)", border: "1px solid #f8717140", borderRadius: 6, color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}

          <button onClick={handle} disabled={loading} style={{
            width: "100%", marginTop: 20, padding: "12px", borderRadius: 8, border: "none",
            background: "#38bdf8", color: "#0a0f1a", fontWeight: 700, fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            fontFamily: "'Inter', sans-serif"
          }}>
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </button>

          {!isLogin && (
            <div style={{ marginTop: 12, color: "#6b7280", fontSize: 12, textAlign: "center" }}>
              You'll get ₹10,00,000 + 100 TATA shares to start!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
