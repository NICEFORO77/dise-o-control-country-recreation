"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getStoredToken, persistSession } from "@/lib/api";

type LoginPayload = {
  token: string;
  tokenType: string;
  user: {
    id: number;
    username: string;
    role: string;
    fullName: string;
    email?: string | null;
    telefono?: string | null;
    ultimoAcceso?: string | null;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin2026*");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getStoredToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch<LoginPayload>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });

      persistSession(response.token, response.user);
      router.replace("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
      <div className="hero-shape left-[-6rem] top-[-4rem] h-48 w-48 bg-teal-300/60" />
      <div className="hero-shape bottom-[-3rem] right-[-2rem] h-56 w-56 bg-amber-300/60" />

      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.9fr]">
        <section className="glass-panel relative overflow-hidden rounded-[2rem] p-8 lg:p-12">
          <div className="mb-10 inline-flex rounded-full border border-teal-200 bg-white/70 px-4 py-2 text-sm font-medium text-teal-800">
            Recreo Campestre Heliconias Pucallpa
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 lg:text-6xl">
            Atención y control interno.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Recreo Campestre Heliconias Pucallpa
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <article className="rounded-[1.5rem] border border-white/70 bg-white/70 p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.24em] text-teal-700">Administrador</p>
              <p className="mt-3 text-xl font-semibold text-slate-900">admin / Admin2026*</p>
            </article>
            <article className="rounded-[1.5rem] border border-white/70 bg-white/70 p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.24em] text-teal-700">Operador</p>
              <p className="mt-3 text-xl font-semibold text-slate-900">operador / Operador2026*</p>
            </article>
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] p-8 lg:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Iniciar sesión</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">Recreo Campestre Heliconias Pucallpa</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Atención y control interno.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Usuario</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="admin"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Contraseña</span>
              <input
                type="password"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Validando acceso..." : "Entrar al dashboard"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
