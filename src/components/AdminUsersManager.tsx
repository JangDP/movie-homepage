"use client";

import { FormEvent, useEffect, useState } from "react";

import { useAdminUser } from "@/components/AdminAuthContext";
import { supabase } from "@/lib/supabase";
import {
  adminRoleLabels,
  canManageAdmins,
  type AdminRole,
  type AdminUser,
} from "@/types/admin";

const roleOptions: AdminRole[] = ["super_admin", "admin", "editor"];

function mapAdminUser(row: {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
}): AdminUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

export function AdminUsersManager() {
  const currentAdmin = useAdminUser();
  const canManage = canManageAdmins(currentAdmin.role);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      if (!supabase || !canManage) {
        return;
      }

      const { data, error } = await supabase
        .from("admin_users")
        .select("id,email,role,created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(`관리자 목록 조회 실패: ${error.message}`);
        return;
      }

      setUsers((data ?? []).map((row) => mapAdminUser(row as Parameters<typeof mapAdminUser>[0])));
    }

    loadUsers();
  }, [canManage]);

  async function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !canManage) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const role = String(formData.get("role") ?? "editor") as AdminRole;

    if (!email) {
      setMessage("이메일을 입력하세요.");
      return;
    }

    setPending(true);
    setMessage("");

    const { data, error } = await supabase
      .from("admin_users")
      .insert({ email, role })
      .select("id,email,role,created_at")
      .single();

    setPending(false);

    if (error) {
      setMessage(`관리자 추가 실패: ${error.message}`);
      return;
    }

    setUsers((current) => [mapAdminUser(data as Parameters<typeof mapAdminUser>[0]), ...current]);
    form.reset();
    setMessage("관리자를 추가했습니다.");
  }

  async function updateRole(user: AdminUser, role: AdminRole) {
    if (!supabase || !canManage) {
      return;
    }

    const { error } = await supabase.from("admin_users").update({ role }).eq("id", user.id);

    if (error) {
      setMessage(`권한 변경 실패: ${error.message}`);
      return;
    }

    setUsers((current) =>
      current.map((item) => (item.id === user.id ? { ...item, role } : item)),
    );
    setMessage("권한을 변경했습니다.");
  }

  async function deleteUser(user: AdminUser) {
    if (!supabase || !canManage) {
      return;
    }

    if (user.email === currentAdmin.email) {
      setMessage("현재 로그인한 최고 관리자는 삭제할 수 없습니다.");
      return;
    }

    const confirmed = window.confirm(`${user.email} 관리자를 삭제할까요?`);

    if (!confirmed) {
      return;
    }

    const { error } = await supabase.from("admin_users").delete().eq("id", user.id);

    if (error) {
      setMessage(`관리자 삭제 실패: ${error.message}`);
      return;
    }

    setUsers((current) => current.filter((item) => item.id !== user.id));
    setMessage("관리자를 삭제했습니다.");
  }

  if (!canManage) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-black/50 p-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-500">
          접근 제한
        </p>
        <h2 className="mt-3 text-2xl font-black text-white">최고 관리자만 접근할 수 있습니다.</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          관리자 추가, 삭제, 권한 변경은 super_admin 권한만 사용할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-zinc-800 bg-black/50 p-5">
        <h2 className="text-lg font-bold text-white">관리자 추가</h2>
        <form onSubmit={addUser} className="mt-5 grid gap-4 md:grid-cols-[1fr_180px_120px] md:items-end">
          <label className="block text-sm font-semibold text-zinc-300">
            이메일
            <input
              type="email"
              name="email"
              placeholder="admin@example.com"
              className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-300">
            권한
            <select
              name="role"
              defaultValue="editor"
              className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {adminRoleLabels[role]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={pending}
            className="min-h-10 rounded bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {pending ? "추가 중..." : "추가"}
          </button>
        </form>
        {message ? <p className="mt-4 text-sm font-bold text-zinc-300">{message}</p> : null}
      </section>

      <section className="rounded-lg border border-zinc-800 bg-black/50 p-5">
        <h2 className="text-lg font-bold text-white">관리자 목록</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-3 pr-4">이메일</th>
                <th className="py-3 pr-4">권한</th>
                <th className="py-3 pr-4">생성일</th>
                <th className="py-3">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {users.map((user) => (
                <tr key={user.id} className="text-zinc-300">
                  <td className="py-4 pr-4 font-bold text-white">{user.email}</td>
                  <td className="py-4 pr-4">
                    <select
                      value={user.role}
                      onChange={(event) => void updateRole(user, event.target.value as AdminRole)}
                      className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {adminRoleLabels[role]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-4 pr-4 text-zinc-500">
                    {new Date(user.createdAt).toLocaleString("ko-KR")}
                  </td>
                  <td className="py-4">
                    <button
                      type="button"
                      disabled={user.email === currentAdmin.email}
                      onClick={() => void deleteUser(user)}
                      className="rounded border border-red-900 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">등록된 관리자가 없습니다.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
