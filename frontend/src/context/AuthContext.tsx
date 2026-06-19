import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types";
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL ?? "";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login:    (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout:   () => void;
  loading:  boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount — restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("tradex_token");
    const savedUser  = localStorage.getItem("tradex_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${BASE}/auth/login`, { email, password });
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    localStorage.setItem("tradex_token", t);
    localStorage.setItem("tradex_user", JSON.stringify(u));
    axios.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await axios.post(`${BASE}/auth/register`, { email, password, name });
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    localStorage.setItem("tradex_token", t);
    localStorage.setItem("tradex_user", JSON.stringify(u));
    axios.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("tradex_token");
    localStorage.removeItem("tradex_user");
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
