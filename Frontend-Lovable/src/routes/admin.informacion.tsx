import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminTitle } from "@/components/admin/AdminLayout";
import { Card, Field, Input, Textarea, Btn } from "@/components/admin/ui";
import { fallbackBusinessInfo, getBusinessInfo, updateBusinessInfo, type BusinessInfo } from "@/lib/business-info";

export const Route = createFileRoute("/admin/informacion")({ component: Page });

function Page() {
  const [data, setData] = useState<BusinessInfo>(fallbackBusinessInfo);
  const [form, setForm] = useState<BusinessInfo>(fallbackBusinessInfo);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const set = (k: keyof BusinessInfo, v: string) => setForm({ ...form, [k]: v });

  useEffect(() => {
    let alive = true;
    getBusinessInfo()
      .then((info) => {
        if (!alive) return;
        setData(info);
        setForm(info);
        setError("");
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "No se pudo cargar la información del negocio");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateBusinessInfo(form);
      setData(updated);
      setForm(updated);
      setError("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la información del negocio");
    }
  };

  return (
    <div>
      <AdminTitle title="Información del Negocio" subtitle="Edita la información institucional que se muestra en el sitio público." />
      {error && <p className="mb-4 text-sm" style={{ color: "var(--destructive)" }}>{error}</p>}
      {loading ? (
        <Card className="max-w-3xl">
          <p className="font-serif" style={{ color: "var(--coffee)" }}>Cargando información del negocio...</p>
        </Card>
      ) : (
        <form onSubmit={save} className="space-y-6 max-w-3xl">
          <Card>
            <h2 className="text-3xl mb-4" style={{ color: "var(--forest)" }}>Historia y descripción</h2>
            <Field label="Historia / Descripción General"><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
            <Field label="Slogan"><Input value={form.slogan} onChange={(e) => set("slogan", e.target.value)} /></Field>
          </Card>
          <Card>
            <h2 className="text-3xl mb-4" style={{ color: "var(--forest)" }}>Contacto y ubicación</h2>
            <Field label="Teléfono"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="Correo de contacto"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Dirección"><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
          </Card>
          <div className="flex gap-3 items-center">
            <Btn type="button" variant="outline" onClick={() => setForm(data)}>Cancelar</Btn>
            <Btn type="submit">Guardar</Btn>
            {saved && <span className="font-serif italic" style={{ color: "var(--forest)" }}>Guardado</span>}
          </div>
        </form>
      )}
    </div>
  );
}
