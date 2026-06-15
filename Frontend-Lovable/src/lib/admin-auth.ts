import { useEffect, useState } from "react";

export type Role = "Super Admin" | "Admin";
export type AdminUser = {
  id: string;
  id_admin: string;
  name: string;
  email: string;
  correo: string;
  role: Role;
  rol: Role;
  activo: boolean;
};

type AdminPayload = Partial<AdminUser> & {
  password?: string;
  contrasena?: string;
  contraseña?: string;
};
type AdminSession = { admin: AdminUser; token: string };

const SESSION_KEY = "amorena.session";
const RESET_KEY = "amorena.passwordReset";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function normalizeAdmin(admin: AdminPayload): AdminUser {
  const id = String(admin.id_admin || admin.id || "");
  const email = String(admin.correo || admin.email || "");
  const role = (admin.rol || admin.role || "Admin") as Role;

  return {
    id,
    id_admin: id,
    name: String(admin.name || email),
    email,
    correo: email,
    role,
    rol: role,
    activo: admin.activo ?? true,
  };
}

function readSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(SESSION_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value);
    if ("admin" in parsed && "token" in parsed) return { admin: normalizeAdmin(parsed.admin), token: String(parsed.token) };
    return { admin: normalizeAdmin(parsed), token: "" };
  } catch {
    return null;
  }
}

function writeSession(admin: AdminUser, token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ admin, token }));
}

export async function adminApiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const session = readSession();
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options?.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Error al comunicarse con el servidor");
  }
  return data as T;
}

export function currentUser(): AdminUser | null {
  return readSession()?.admin ?? null;
}

export async function login(email: string, password: string): Promise<AdminUser | null> {
  try {
    const data = await adminApiRequest<{ admin: AdminPayload; token: string }>("/admin-auth/login", {
      method: "POST",
      body: JSON.stringify({ correo: email, password }),
    });
    const admin = normalizeAdmin(data.admin);
    writeSession(admin, data.token);
    window.dispatchEvent(new Event("amorena.session"));
    return admin;
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("amorena.session"));
}

export async function requestPasswordReset(email: string): Promise<boolean> {
  try {
    await adminApiRequest("/admin-auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify({ correo: email }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function verifyResetCode(email: string, code: string): Promise<string | null> {
  try {
    const data = await adminApiRequest<{ resetToken: string }>("/admin-auth/verify-reset-code", {
      method: "POST",
      body: JSON.stringify({ correo: email, code }),
    });
    return data.resetToken;
  } catch {
    return null;
  }
}

export function savePasswordResetToken(email: string, resetToken: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RESET_KEY, JSON.stringify({ email, resetToken }));
}

export function getPasswordResetToken(email: string): string {
  if (typeof window === "undefined") return "";
  try {
    const value = sessionStorage.getItem(RESET_KEY);
    if (!value) return "";
    const parsed = JSON.parse(value);
    return parsed.email === email ? String(parsed.resetToken || "") : "";
  } catch {
    return "";
  }
}

export function clearPasswordResetToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RESET_KEY);
}

export async function resetPassword(email: string, newPass: string, resetToken: string): Promise<boolean> {
  try {
    await adminApiRequest("/admin-auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ correo: email, password: newPass, resetToken }),
    });
    clearPasswordResetToken();
    return true;
  } catch {
    return false;
  }
}

export async function getUsers(): Promise<AdminUser[]> {
  const data = await adminApiRequest<{ admins: AdminPayload[] }>("/admin-auth");
  return data.admins.map(normalizeAdmin);
}

export async function createUser(admin: { email: string; password: string; role: Role }) {
  const data = await adminApiRequest<{ admin: AdminPayload }>("/admin-auth", {
    method: "POST",
    body: JSON.stringify({ correo: admin.email, password: admin.password, rol: admin.role }),
  });
  return normalizeAdmin(data.admin);
}

export async function updateUser(admin: AdminUser) {
  const data = await adminApiRequest<{ admin: AdminPayload }>(`/admin-auth/${admin.id_admin}`, {
    method: "PUT",
    body: JSON.stringify({ correo: admin.email, rol: admin.role, activo: admin.activo }),
  });
  return normalizeAdmin(data.admin);
}

export async function deleteUser(idAdmin: string) {
  await adminApiRequest(`/admin-auth/${idAdmin}`, { method: "DELETE" });
}

export function useAuth() {
  const [user, setUser] = useState<AdminUser | null>(() => currentUser());

  useEffect(() => {
    const sync = () => setUser(currentUser());
    window.addEventListener("amorena.session", sync);
    return () => window.removeEventListener("amorena.session", sync);
  }, []);

  return user;
}
