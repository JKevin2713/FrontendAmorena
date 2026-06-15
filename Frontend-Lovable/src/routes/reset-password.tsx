import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { getPasswordResetToken, resetPassword } from "@/lib/admin-auth";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>) => ({ email: (s.email as string) || "" }),
  head: () => ({ meta: [{ title: "Cambiar contraseña - Amorena" }, { name: "robots", content: "noindex" }] }),
  component: ResetPage,
});

function ResetPage() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const resetToken = getPasswordResetToken(email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return setError("Primero verifica el código enviado al correo.");
    if (p1.length < 6) return setError("Mínimo 6 caracteres");
    if (p1 !== p2) return setError("Las contraseñas no coinciden");
    if (!await resetPassword(email, p1, resetToken)) return setError("Solicitud inválida o vencida");
    setDone(true);
    setTimeout(() => navigate({ to: "/login" }), 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--cream)" }}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6"><Logo /></div>
        <div className="rounded-lg p-8" style={{ background: "var(--card)", border: "1px solid var(--tan-dark)" }}>
          <h1 className="text-4xl text-center mb-2" style={{ color: "var(--forest)" }}>Cambiar contraseña</h1>
          {done ? (
            <p className="text-center font-serif" style={{ color: "var(--coffee)" }}>Contraseña actualizada. Redirigiendo...</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p className="font-serif text-sm text-center" style={{ color: "var(--coffee)" }}>Para <strong>{email || "su cuenta"}</strong></p>
              {!resetToken && (
                <p className="text-sm text-center" style={{ color: "var(--destructive)" }}>
                  Necesitas solicitar y verificar un código antes de cambiar la contraseña.
                </p>
              )}
              <input type="password" placeholder="Nueva contraseña" required value={p1} onChange={(e) => setP1(e.target.value)} className="w-full px-3 py-2.5 rounded font-serif outline-none" style={{ background: "var(--cream)", border: "1px solid var(--tan-dark)", color: "var(--coffee)" }} />
              <input type="password" placeholder="Confirmar contraseña" required value={p2} onChange={(e) => setP2(e.target.value)} className="w-full px-3 py-2.5 rounded font-serif outline-none" style={{ background: "var(--cream)", border: "1px solid var(--tan-dark)", color: "var(--coffee)" }} />
              {error && <p className="text-sm" style={{ color: "var(--destructive)" }}>{error}</p>}
              <button type="submit" disabled={!resetToken} className="btn-primary w-full justify-center">Guardar</button>
              <Link to="/forgot-password" className="block text-center text-sm font-serif" style={{ color: "var(--forest)" }}>Solicitar otro código</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
