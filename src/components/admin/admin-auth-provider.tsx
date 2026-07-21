"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ADMIN_SESSION_CHANGED_EVENT,
  ADMIN_SESSION_EXPIRED_EVENT,
  ADMIN_SESSION_TOKEN_KEY,
  clearAdminSessionToken,
  getAdminSessionToken,
  isAdminSessionTokenValid,
  setAdminSessionToken,
} from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { Skeleton } from "@/components/ui/skeleton";

export const ADMIN_PORTAL_ROOT =
  "/ops-e246f9e101aae83bee9e9600-portal";
export const ADMIN_LOGIN_PATH = `${ADMIN_PORTAL_ROOT}/login`;
export const ADMIN_DASHBOARD_PATH = `${ADMIN_PORTAL_ROOT}/dashboard`;

type AdminAuthContextValue = {
  isAuthenticated: boolean;
  establishSession: (token: string) => void;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

function subscribeToAdminSession(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === ADMIN_SESSION_TOKEN_KEY) onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(ADMIN_SESSION_CHANGED_EVENT, onStoreChange);
  window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(ADMIN_SESSION_CHANGED_EVENT, onStoreChange);
    window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, onStoreChange);
  };
}

function getAdminSessionSnapshot() {
  return isAdminSessionTokenValid(getAdminSessionToken());
}

function getServerSessionSnapshot() {
  return false;
}

function subscribeToNothing() {
  return () => undefined;
}

function getHydratedSnapshot() {
  return true;
}

function AdminLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base p-6">
      <div className="w-full max-w-sm space-y-4">
        <Skeleton className="mx-auto size-10 rounded-xl" />
        <Skeleton className="mx-auto h-5 w-40" />
        <Skeleton className="h-36 w-full" />
      </div>
    </div>
  );
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const initialized = useSyncExternalStore(
    subscribeToNothing,
    getHydratedSnapshot,
    getServerSessionSnapshot,
  );
  const isAuthenticated = useSyncExternalStore(
    subscribeToAdminSession,
    getAdminSessionSnapshot,
    getServerSessionSnapshot,
  );
  const isLoginPath = pathname === ADMIN_LOGIN_PATH;

  useEffect(() => {
    if (!initialized) return;

    if (isLoginPath && isAuthenticated) {
      router.replace(ADMIN_DASHBOARD_PATH);
      return;
    }
    if (!isLoginPath && !isAuthenticated) {
      if (getAdminSessionToken()) clearAdminSessionToken();
      router.replace(ADMIN_LOGIN_PATH);
    }
  }, [initialized, isAuthenticated, isLoginPath, router]);

  const establishSession = useCallback((token: string) => {
    setAdminSessionToken(token);
  }, []);

  const logout = useCallback(() => {
    clearAdminSessionToken();
    router.replace(ADMIN_LOGIN_PATH);
  }, [router]);

  const value = useMemo(
    () => ({ isAuthenticated, establishSession, logout }),
    [establishSession, isAuthenticated, logout],
  );

  if (!initialized) return <AdminLoadingScreen />;

  if (isLoginPath) {
    if (isAuthenticated) return <AdminLoadingScreen />;
    return (
      <AdminAuthContext.Provider value={value}>
        {children}
      </AdminAuthContext.Provider>
    );
  }

  if (!isAuthenticated) return <AdminLoadingScreen />;

  return (
    <AdminAuthContext.Provider value={value}>
      <AdminShell onLogout={logout}>{children}</AdminShell>
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
