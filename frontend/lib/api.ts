const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type SessionUser = {
  id: number;
  username: string;
  role: string;
  fullName: string;
  email?: string | null;
  telefono?: string | null;
  ultimoAcceso?: string | null;
};

export function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("heliconias-token");
}

export function getStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = localStorage.getItem("heliconias-user");
  return raw ? (JSON.parse(raw) as SessionUser) : null;
}

export function persistSession(token: string, user: SessionUser) {
  localStorage.setItem("heliconias-token", token);
  localStorage.setItem("heliconias-user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("heliconias-token");
  localStorage.removeItem("heliconias-user");
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const payload = (await safeJson(response)) as { message?: string } | null;
    throw new Error(payload?.message ?? "No se pudo completar la operación");
  }

  return (await safeJson(response)) as T;
}

export async function uploadProductPhoto(productId: number, file: File) {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/productos/${productId}/foto`, {
    method: "POST",
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  if (!response.ok) {
    const payload = (await safeJson(response)) as { message?: string } | null;
    throw new Error(payload?.message ?? "No se pudo cargar la imagen");
  }

  return safeJson(response);
}

async function safeJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export { API_URL };
