"use client";

import { createContext, useContext } from "react";

import type { AdminUser } from "@/types/admin";

const AdminAuthContext = createContext<AdminUser | null>(null);

export function AdminAuthProvider({
  value,
  children,
}: {
  value: AdminUser;
  children: React.ReactNode;
}) {
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminUser() {
  const value = useContext(AdminAuthContext);

  if (!value) {
    throw new Error("Admin auth context is not available.");
  }

  return value;
}

