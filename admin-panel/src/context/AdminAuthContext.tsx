"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export interface AdminUser {
  id: string;
  staffId: string;
  fullName: string;
  email: string;
  department: string;
  role: "MASTER_ADMIN" | "STAFF";
  allowedModules?: string[];
  presenceStatus?: "ONLINE" | "IDLE" | "OFFLINE";
  lastLoginAt?: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  hasModuleAccess: (moduleKey: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://stayq-api-608570851336.asia-south1.run.app";

if (typeof window !== "undefined") {
  axios.defaults.baseURL = API_BASE;
  axios.defaults.headers.common["x-admin-key"] = "stayq-admin-secret-2026";
}

// Default fallback master credentials for instant administrative bootstrap if DB is initializing
const MASTER_ADMIN_USER: AdminUser = {
  id: "admin-master-001",
  staffId: "ADMIN-001",
  fullName: "Stay Q Master Admin",
  email: "admin@stayq.space",
  department: "Executive & Platform Operations",
  role: "MASTER_ADMIN",
  allowedModules: ["ALL"],
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("stayq_admin_token");
      const storedUser = localStorage.getItem("stayq_admin_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setAdminUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to load admin session from storage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }

    const currentStaffId = adminUser?.staffId;
    const isMaster = adminUser?.role === "MASTER_ADMIN";

    // Notify backend if it's a staff member
    if (currentStaffId && !isMaster) {
      try {
        await axios.post(`${API_BASE}/api/v1/admin/staff/logout`, { staffId: currentStaffId }, { timeout: 3000 });
      } catch (e) {
        console.warn("Logout notification error (proceeding with local purge):", e);
      }
    }

    try {
      localStorage.removeItem("stayq_admin_token");
      localStorage.removeItem("stayq_admin_user");
      sessionStorage.clear();
    } catch (e) {
      console.warn("Storage purge warning:", e);
    }

    setToken(null);
    setAdminUser(null);

    if (typeof window !== "undefined") {
      window.location.replace("/login/");
    } else {
      router.replace("/login/");
    }
  }, [adminUser, router]);

  // Real-time Staff Heartbeat to keep live presence active
  useEffect(() => {
    if (!adminUser?.staffId || adminUser.role === "MASTER_ADMIN") {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      return;
    }

    const sendHeartbeat = async () => {
      try {
        await axios.post(`${API_BASE}/api/v1/admin/staff/heartbeat`, {
          staffId: adminUser.staffId,
        });
      } catch (err: any) {
        // If 401, session was killed by Master Admin (Force Logout)
        if (err?.response?.status === 401) {
          console.warn("[AdminAuth] Session revoked by Master Admin.");
          alert("Your Stay Q staff session was terminated by the Master Admin.");
          await logout();
        }
      }
    };

    // Initial heartbeat on mount
    sendHeartbeat();

    // Heartbeat every 40 seconds
    heartbeatTimerRef.current = setInterval(sendHeartbeat, 40000);

    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [adminUser?.staffId, adminUser?.role, logout]);

  const login = async (identifier: string, password: string): Promise<{ success: boolean; message: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, message: "Please enter Staff ID / Email and Password." };
    }

    // 1. Try Backend Staff Authentication
    try {
      const res = await axios.post(`${API_BASE}/api/v1/admin/staff/login`, {
        identifier: cleanId,
        password: cleanPass,
      });

      if (res.data && res.data.success && res.data.user) {
        const u: AdminUser = res.data.user;
        const fakeJwt = `sq_staff_${Date.now()}_${Math.random().toString(36).substring(2)}`;

        setToken(fakeJwt);
        setAdminUser(u);
        localStorage.setItem("stayq_admin_token", fakeJwt);
        localStorage.setItem("stayq_admin_user", JSON.stringify(u));

        return { success: true, message: `Welcome back, ${u.fullName}!` };
      }
    } catch (apiErr: any) {
      const errMsg = apiErr?.response?.data?.message || apiErr?.message;

      // 2. Fallback Master Key check for Emergency / Platform Owner Access
      if (
        (cleanId === "admin@stayq.space" || cleanId === "admin-001" || cleanId === "mayank" || cleanId === "admin" || cleanId === "shayan@stayq.space") &&
        (cleanPass === "StayQ@2026" || cleanPass === "Admin@StayQ2026!" || cleanPass === "admin123" || cleanPass === "StayQAdmin#2026" || cleanPass === "Password@123")
      ) {
        const fakeJwt = `sq_master_${Date.now()}`;
        setToken(fakeJwt);
        setAdminUser(MASTER_ADMIN_USER);
        localStorage.setItem("stayq_admin_token", fakeJwt);
        localStorage.setItem("stayq_admin_user", JSON.stringify(MASTER_ADMIN_USER));

        return { success: true, message: "Master Admin logged in successfully!" };
      }

      return {
        success: false,
        message: errMsg || "Invalid Staff ID / Email or Password. Access denied.",
      };
    }

    // Fallback Master Key check
    if (
      (cleanId === "admin@stayq.space" || cleanId === "admin-001" || cleanId === "mayank" || cleanId === "admin" || cleanId === "shayan@stayq.space") &&
      (cleanPass === "StayQ@2026" || cleanPass === "Admin@StayQ2026!" || cleanPass === "admin123" || cleanPass === "StayQAdmin#2026" || cleanPass === "Password@123")
    ) {
      const fakeJwt = `sq_master_${Date.now()}`;
      setToken(fakeJwt);
      setAdminUser(MASTER_ADMIN_USER);
      localStorage.setItem("stayq_admin_token", fakeJwt);
      localStorage.setItem("stayq_admin_user", JSON.stringify(MASTER_ADMIN_USER));

      return { success: true, message: "Master Admin logged in successfully!" };
    }

    return { success: false, message: "Invalid credentials. Please verify your Staff ID & Password." };
  };

  /**
   * Helper to verify if logged in staff has access to a particular module
   */
  const hasModuleAccess = useCallback((moduleKey: string): boolean => {
    if (!adminUser) return false;
    // Master Admin has universal clearance
    if (adminUser.role === "MASTER_ADMIN") return true;
    if (adminUser.allowedModules?.includes("ALL")) return true;
    return adminUser.allowedModules?.includes(moduleKey) ?? false;
  }, [adminUser]);

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        token,
        isAuthenticated: !!token && !!adminUser,
        isLoading,
        login,
        logout,
        hasModuleAccess,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return ctx;
};

