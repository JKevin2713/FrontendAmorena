import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { login, useAuth } from "@/lib/admin-auth";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || "/admin/informacion" }),
  head: () => ({ meta: [{ title: "Iniciar sesión — Amorena Admin" }, { name: "robots", content: "noindex" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const user = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (user) {
    navigate({ to: search.redirect as "/admin/informacion" });
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const u = await login(email, password);
    if (!u) { setError("Credenciales inválidas"); return; }
    navigate({ to: search.redirect as "/admin/informacion" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--cream)" }}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6"><Logo /></div>
        <div className="rounded-lg p-8" style={{ background: "var(--card)", border: "1px solid var(--tan-dark)", boxShadow: "0 8px 30px rgba(0,0,0,.06)" }}>
          <h1 className="text-5xl text-center mb-1" style={{ color: "var(--forest)" }}>Bienvenido</h1>
          <p className="font-serif italic text-center mb-6" style={{ color: "var(--coffee)" }}>Panel de Administración</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block font-serif font-semibold mb-1.5" style={{ color: "var(--coffee)" }}>Correo electrónico</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded font-serif outline-none" style={{ background: "var(--cream)", border: "1px solid var(--tan-dark)", color: "var(--coffee)" }} />
            </div>
            <div>
              <label className="block font-serif font-semibold mb-1.5" style={{ color: "var(--coffee)" }}>Contraseña</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 rounded font-serif outline-none" style={{ background: "var(--cream)", border: "1px solid var(--tan-dark)", color: "var(--coffee)" }} />
            </div>
            {error && <p className="text-sm" style={{ color: "var(--destructive)" }}>{error}</p>}
            <button type="submit" className="btn-primary w-full justify-center">Iniciar sesión</button>
          </form>
          <div className="flex justify-between mt-4 text-sm font-serif">
            <Link to="/forgot-password" style={{ color: "var(--forest)" }}>¿Olvidó su contraseña?</Link>
            <Link to="/" style={{ color: "var(--coffee)", opacity: .7 }}>← Volver al sitio</Link>
          </div>
          <div className="mt-6 p-3 rounded text-xs font-serif" style={{ background: "var(--cream)", color: "var(--coffee)" }}>
            <strong>Demo:</strong> admin@amorena.com / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
