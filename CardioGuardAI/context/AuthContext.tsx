import React, { createContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

interface AuthContextType {
  token: string | null;
  role: string | null;
  login: (token: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  role: null,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: any) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const loadAuth = async () => {
      const storedToken = await SecureStore.getItemAsync("token");
      const storedRole = await SecureStore.getItemAsync("role");

      if (storedToken && storedRole) {
        setToken(storedToken);
        setRole(storedRole);
      }
    };

    loadAuth();
  }, []);

  const login = async (token: string, role: string) => {
    await SecureStore.setItemAsync("token", token);
    await SecureStore.setItemAsync("role", role);

    setToken(token);
    setRole(role);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("role");

    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
