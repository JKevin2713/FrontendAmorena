import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Facebook, Instagram, Linkedin, Mail, Music2, Phone, Pencil, Trash2, Video } from "lucide-react";
import { AdminTitle } from "@/components/admin/AdminLayout";
import { Card, Field, Input, Btn, Table, Modal } from "@/components/admin/ui";
import { createRedSocial, deleteRedSocial, getRedesSociales, updateRedSocial, type RedSocial } from "@/lib/admin-socials";

export const Route = createFileRoute("/admin/redes")({ component: Page });

function SocialIcon({ name, url = "" }: { name: string; url?: string }) {
  const lower = `${name} ${url}`.toLowerCase();
  if (lower.includes("instagram")) return <Instagram size={17} />;
  if (lower.includes("facebook") || lower.includes("fb.com")) return <Facebook size={17} />;
  if (lower.includes("tiktok")) return <Music2 size={17} />;
  if (lower.includes("youtube") || lower.includes("youtu.be")) return <Video size={17} />;
  if (lower.includes("linkedin")) return <Linkedin size={17} />;
  if (lower.includes("whatsapp") || lower.includes("wa.me")) return <Phone size={17} />;
  if (lower.includes("correo") || lower.includes("email") || lower.includes("mail")) return <Mail size={17} />;
  return <ExternalLink size={17} />;
}

function Page() {
  const [items, setItems] = useState<RedSocial[]>([]);
  const [form, setForm] = useState({ name: "", url: "" });
  const [editing, setEditing] = useState<RedSocial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RedSocial | null>(null);
  const [notice, setNotice] = useState<{ title: string; message: string; type: "success" | "warning" } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadRedesSociales = async () => {
    try {
      setLoading(true);
      setItems(await getRedesSociales());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las redes sociales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRedesSociales();
  }, []);

  const add = async () => {
    if (!form.name.trim()) return;

    try {
      const redSocial = await createRedSocial({
        name: form.name,
        url: form.url,
        orden: items.length + 1,
      });
      setItems([...items, redSocial]);
      setForm({ name: "", url: "" });
      setError("");
      setNotice({
        title: "Red social agregada",
        message: `${redSocial.name} ya está registrada en la base de datos.`,
        type: "success",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la red social");
    }
  };

  const saveEditing = async () => {
    if (!editing) return;

    try {
      const updated = await updateRedSocial(editing);
      setItems(items.map((x) => x.id_red_social === updated.id_red_social ? updated : x));
      setEditing(null);
      setError("");
      setNotice({
        title: "Cambios guardados",
        message: `El enlace de ${updated.name} fue actualizado.`,
        type: "success",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la red social");
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;

    try {
      await deleteRedSocial(deleteTarget.id_red_social);
      setItems(items.filter((x) => x.id_red_social !== deleteTarget.id_red_social));
      setNotice({
        title: "Red social eliminada",
        message: `${deleteTarget.name} ya no aparecerá en esta lista.`,
        type: "success",
      });
      setDeleteTarget(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la red social");
    }
  };

  return (
    <div>
      <AdminTitle title="Redes Sociales" subtitle="Administra los enlaces a redes sociales que aparecen en el sitio público." />
      {error && <p className="mb-4 text-sm" style={{ color: "var(--destructive)" }}>{error}</p>}

      <Card className="mb-6">
        <h2 className="text-2xl mb-4" style={{ color: "var(--forest)" }}>Enlaces registrados</h2>
        {loading ? (
          <p className="font-serif" style={{ color: "var(--coffee)" }}>Cargando redes sociales...</p>
        ) : (
          <Table headers={["Red social", "URL", "Estado", "Acciones"]}>
            {items.map((s) => (
              <tr key={s.id_red_social} className="border-t" style={{ borderColor: "var(--tan-dark)" }}>
                <td className="px-4 py-3" style={{ color: "var(--coffee)" }}>
                  <span className="inline-flex items-center gap-2">
                    <span className="size-8 rounded-full inline-flex items-center justify-center" style={{ background: "var(--cream)", color: "var(--forest)", border: "1px solid var(--tan-dark)" }}>
                      <SocialIcon name={s.name} url={s.url} />
                    </span>
                    {s.name}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: "var(--coffee)" }}>{s.url || <em>Sin enlace</em>}</td>
                <td className="px-4 py-3" style={{ color: "var(--coffee)" }}>{s.activo ? "Activo" : "Inactivo"}</td>
                <td className="px-4 py-3 flex gap-3">
                  <button aria-label={`Editar ${s.name}`} onClick={() => setEditing(s)} style={{ color: "var(--forest)" }}><Pencil size={18} /></button>
                  <button aria-label={`Eliminar ${s.name}`} onClick={() => setDeleteTarget(s)} style={{ color: "var(--destructive)" }}><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card className="max-w-xl">
        <h2 className="text-2xl mb-4" style={{ color: "var(--forest)" }}>Agregar una nueva red social</h2>
        <Field label="Red social"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="URL del enlace"><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></Field>
        <Btn onClick={() => void add()}>Agregar</Btn>
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar enlace registrado">
        {editing && (
          <>
            <Field label="Red social"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, nombre: e.target.value })} /></Field>
            <Field label="URL del enlace"><Input value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} /></Field>
            <Field label="Estado">
              <select
                value={editing.activo ? "true" : "false"}
                onChange={(e) => setEditing({ ...editing, activo: e.target.value === "true" })}
                className="w-full px-3 py-2 rounded font-serif outline-none"
                style={{ background: "var(--cream)", border: "1px solid var(--tan-dark)", color: "var(--coffee)" }}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </Field>
            <div className="flex gap-2 justify-end">
              <Btn variant="outline" onClick={() => setEditing(null)}>Cancelar</Btn>
              <Btn onClick={() => void saveEditing()}>Guardar</Btn>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar red social">
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="size-11 shrink-0 rounded-full inline-flex items-center justify-center" style={{ background: "rgba(190, 24, 24, .1)", color: "var(--destructive)" }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="font-serif leading-relaxed" style={{ color: "var(--coffee)" }}>
                  Vas a eliminar el enlace de <strong>{deleteTarget.name}</strong>.
                </p>
                <p className="mt-2 text-sm font-serif" style={{ color: "var(--coffee)", opacity: .72 }}>
                  Esta acción se guardará en MongoDB y ya no aparecerá en la lista de redes sociales.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Btn>
              <Btn variant="danger" onClick={() => void remove()}>Eliminar enlace</Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!notice} onClose={() => setNotice(null)} title={notice?.title || ""}>
        {notice && (
          <div className="space-y-5">
            <div className="flex gap-4">
              <div
                className="size-11 shrink-0 rounded-full inline-flex items-center justify-center"
                style={{
                  background: notice.type === "success" ? "rgba(22, 101, 52, .1)" : "rgba(146, 64, 14, .12)",
                  color: notice.type === "success" ? "var(--forest)" : "var(--coffee)",
                }}
              >
                {notice.type === "success" ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
              </div>
              <p className="font-serif leading-relaxed" style={{ color: "var(--coffee)" }}>{notice.message}</p>
            </div>
            <div className="flex justify-end">
              <Btn onClick={() => setNotice(null)}>Entendido</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
