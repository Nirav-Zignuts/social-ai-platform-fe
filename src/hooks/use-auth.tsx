"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  clearTokens,
  getAccessToken,
  hasStoredSession,
  onSessionExpired,
  revokeServerSession,
  SessionExpiredError,
  setTokens,
} from "@/lib/api-client";
import type { AuthTokens, User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  completeOAuthLogin: (tokens: AuthTokens) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [sessionResolved, setSessionResolved] = useState(false);

  const clearLocalSession = useCallback(() => {
    clearTokens();
    setEnabled(false);
    queryClient.setQueryData(["auth", "me"], null);
    queryClient.clear();
  }, [queryClient]);

  const handleSessionExpired = useCallback(() => {
    clearLocalSession();
    router.replace("/login");
  }, [clearLocalSession, router]);

  useEffect(() => {
    setEnabled(hasStoredSession());
    setSessionResolved(true);
    return onSessionExpired(handleSessionExpired);
  }, [handleSessionExpired]);

  const {
    data: user,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.auth.me(),
    enabled,
    retry: (failureCount, err) => {
      if (err instanceof SessionExpiredError) return false;
      return failureCount < 1;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (error instanceof SessionExpiredError) {
      handleSessionExpired();
    }
  }, [error, handleSessionExpired]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.auth.login({ email, password });
      setTokens(data.tokens);
      setEnabled(true);
      queryClient.setQueryData(["auth", "me"], data.user);
    },
    [queryClient],
  );

  const completeOAuthLogin = useCallback(
    async (tokens: AuthTokens) => {
      setTokens(tokens);
      setEnabled(true);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    // Capture token first, then clear local session immediately so UI / guards
    // cannot keep using a half-logged-out state.
    const accessToken = getAccessToken();
    clearLocalSession();
    router.replace("/login");
    await revokeServerSession(accessToken);
  }, [clearLocalSession, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading: !sessionResolved || (enabled && isLoading),
      isAuthenticated: Boolean(user) && enabled,
      login,
      completeOAuthLogin,
      logout,
      refetchUser: async () => {
        await refetch();
      },
    }),
    [user, sessionResolved, enabled, isLoading, login, completeOAuthLogin, logout, refetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
