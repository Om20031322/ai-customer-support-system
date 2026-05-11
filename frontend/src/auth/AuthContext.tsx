import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  clearAuthToken,
  fetchMe,
  getStoredAuthToken,
  googleLogin as googleLoginRequest,
  login as loginRequest,
  register as registerRequest,
  storeAuthToken
} from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";
import type { AuthUser } from "../types/ticket";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredAuthToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    clearAuthToken();
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      disconnectSocket();
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    connectSocket(token);

    fetchMe()
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (isMounted) {
          logout();
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [logout, token]);

  const login = useCallback(async (input: { email: string; password: string }) => {
    const result = await loginRequest(input);
    storeAuthToken(result.token);
    setToken(result.token);
    setUser(result.user);
    connectSocket(result.token);
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    const result = await googleLoginRequest({ credential });
    storeAuthToken(result.token);
    setToken(result.token);
    setUser(result.user);
    connectSocket(result.token);
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const result = await registerRequest(input);
      storeAuthToken(result.token);
      setToken(result.token);
      setUser(result.user);
      connectSocket(result.token);
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      googleLogin,
      register,
      logout
    }),
    [googleLogin, isLoading, login, logout, register, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
