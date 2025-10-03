// context/AuthContext.jsx
import { createContext, useContext, useState } from "react";
import { login as apiLogin, register as apiRegister } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      // if localStorage contains "undefined" or empty, skip parsing
      return raw && raw !== "undefined" ? JSON.parse(raw) : null;
    } catch {
      // fallback if JSON.parse fails
      return null;
    }
  });

  function saveAuth(t, u) {
    setToken(t);
    setUser(u);
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
  }

  async function login(email, password) {
    const res = await apiLogin(email, password);
    const { token, user } = res.data || res;   // support both shapes
    saveAuth(token, user);
  }

  async function register(email, password) {
    const res = await apiRegister(email, password);
    const { token, user } = res.data || res;
    saveAuth(token, user);
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
  
}

export function useAuth() {
  return useContext(AuthContext);
}

