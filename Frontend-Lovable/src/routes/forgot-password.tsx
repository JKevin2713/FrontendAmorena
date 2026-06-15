import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { requestPasswordReset, savePasswordResetToken, verifyResetCode } from "@/lib/admin-auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Recuperar contraseña - Amorena" }, { name: "robots", content: "noindex" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    const ok = await requestPasswordReset(email);
    setLoading(false);

    if (!ok) {
      setError("No se pudo enviar el código. Inténtalo de nuevo.");
      return;
    }

    setStep("code");
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    setError("");
    const resetToken = await verifyResetCode(email, code);
    setLoading(false);

    if (!resetToken) {
      setError("Código inválido o vencido.");
      return;
    }

    savePasswordResetToken(email, resetToken);
    navigate({ to: "/reset-password", search: { email } as never });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--cream)" }}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6"><Logo /></div>
        <div className="rounded-lg p-8" style={{ background: "var(--card)", border: "1px solid var(--tan-dark)" }}>
          <h1 className="text-4xl text-center mb-2" style={{ color: "var(--forest)" }}>Recuperar contraseña</h1>

          {step === "email" ? (
            <form onSubmit={sendCode} className="space-y-4">
              <p className="font-serif text-sm text-center mb-2" style={{ color: "var(--coffee)" }}>
                Ingresa el correo registrado de administrador.
              </p>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@amorena.com" className="w-full px-3 py-2.5 rounded font-serif outline-none" style={{ background: "var(--cream)", border: "1px solid var(--tan-dark)", color: "var(--coffee)" }} />
              {error && <p className="text-sm" style={{ color: "var(--destructive)" }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? "Enviando..." : "Enviar código"}</button>
              <Link to="/login" className="block text-center text-sm font-serif" style={{ color: "var(--forest)" }}>Volver al inicio de sesión</Link>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-4">
              <p className="font-serif text-sm text-center mb-2" style={{ color: "var(--coffee)" }}>
                Ingresa el código enviado a <strong>{email}</strong>.
              </p>
              <input inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="w-full px-3 py-2.5 rounded font-serif text-center text-2xl tracking-[.35em] outline-none" style={{ background: "var(--cream)", border: "1px solid var(--tan-dark)", color: "var(--coffee)" }} />
              {error && <p className="text-sm" style={{ color: "var(--destructive)" }}>{error}</p>}
              <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full justify-center">{loading ? "Verificando..." : "Verificar código"}</button>
              <button type="button" disabled={loading} onClick={() => void sendCode()} className="block w-full text-center text-sm font-serif" style={{ color: "var(--forest)" }}>Enviar código de nuevo</button>
              <button type="button" onClick={() => { setStep("email"); setCode(""); setError(""); }} className="block w-full text-center text-sm font-serif" style={{ color: "var(--coffee)", opacity: .75 }}>Cambiar correo</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
