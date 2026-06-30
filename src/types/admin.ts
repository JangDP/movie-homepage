export type AdminRole = "super_admin" | "admin" | "editor";

export type AdminUser = {
  id: string;
  email: string;
  role: AdminRole;
  createdAt: string;
};

export const adminRoleLabels: Record<AdminRole, string> = {
  super_admin: "최고 관리자",
  admin: "관리자",
  editor: "에디터",
};

export function canDeletePosts(role: AdminRole) {
  return role === "super_admin" || role === "admin";
}

export function canManageAdmins(role: AdminRole) {
  return role === "super_admin";
}

