// context/AuthContext.jsx
import { createContext, useContext, useState } from "react";
import { login as apiLogin, register as apiRegister } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  function saveAuth(t, u) {
    setToken(t);
    setUser(u);
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
  }

  async function login(email, password) {
    const { data } = await apiLogin(email, password);
    saveAuth(data.token, data.user);
  }

  async function register(email, password) {
    const { data } = await apiRegister(email, password);
    saveAuth(data.token, data.user);
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
