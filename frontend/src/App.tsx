import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthPage } from "./pages/AuthPage";
import { TradingPage } from "./pages/TradingPage";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0f1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#38bdf8", fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  return user ? <TradingPage /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
