import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { AdminTitle } from "@/components/admin/AdminLayout";
import { api, ApiPagina, ApiMiembro } from "@/lib/api";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const Route = createFileRoute("/admin/conozcanos")({ component: Page });

const SECCIONES_DEF = [
  { slug: "que-es",           label: "¿Qué es Amorena?" },
  { slug: "quienes-somos",    label: "¿Quiénes somos?" },
  { slug: "nuestra-historia", label: "Nuestra historia" },
];

function inputCls() { return "w-full px-3 py-2 rounded-lg font-serif text-sm outline-none"; }
function inputStyle() { return { background: "var(--card)", border: "1px solid var(--tan-dark)", color: "var(--coffee)" }; }

function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6" style={{ background: "var(--cream)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--coffee)" }}>{title}</h2>
          <button onClick={onClose}><X size={18} style={{ color: "var(--coffee)" }} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmDialog({ open, message, onCancel, onConfirm }: { open: boolean; message: string; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative rounded-2xl w-full max-w-xs shadow-2xl p-8 text-center" style={{ background: "var(--cream)" }}>
        <p className="font-serif text-base mb-8" style={{ color: "var(--coffee)" }}>{message}</p>
        <div className="flex justify-center gap-8">
          <button className="font-serif text-sm" style={{ color: "var(--coffee)" }} onClick={onCancel}>Cancelar</button>
          <button className="px-6 py-2 rounded-lg font-serif text-sm text-white" style={{ background: "var(--forest)" }} onClick={onConfirm}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

type MiembroForm = Omit<ApiMiembro, "_id">;
const blankMiembro = (): MiembroForm => ({ nombre: "", rol: "", descripcion: "", iniciales: "", imagen: "" });

function Page() {
  const [pagina,  setPagina]  = useState<ApiPagina | null>(null);
  const [loading, setLoading] = useState(true);
  const [secciones, setSecciones] = useState(
    SECCIONES_DEF.map(({ slug }) => ({ slug, titulo: "", texto: "", imagen: "" }))
  );
  const [savingSec,     setSavingSec]     = useState(false);
  const [miembroModal,  setMiembroModal]  = useState<{ open: boolean; mode: "add" | "edit"; id?: string; data: MiembroForm }>({ open: false, mode: "add", data: blankMiembro() });
  const [deleteMiembro, setDeleteMiembro] = useState<ApiMiembro | null>(null);
  const [savingMiembro, setSavingMiembro] = useState(false);

  useEffect(() => {
    api.paginas.get("conozcanos")
      .then(res => {
        setPagina(res.pagina);
        setSecciones(SECCIONES_DEF.map(({ slug }) =>
          res.pagina.secciones.find(s => s.slug === slug) ?? { slug, titulo: "", texto: "", imagen: "" }
        ));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveSecciones = async () => {
    setSavingSec(true);
    try {
      const otherSecs = pagina?.secciones.filter(s => !SECCIONES_DEF.map(x => x.slug).includes(s.slug)) ?? [];
      const res = await api.paginas.update("conozcanos", { secciones: [...otherSecs, ...secciones] });
      setPagina(res.pagina);
      alert("Secciones guardadas.");
    } catch {
      alert("Error al guardar.");
    } finally {
      setSavingSec(false);
    }
  };

  const saveMiembro = async () => {
    if (!miembroModal.data.nombre) return;
    setSavingMiembro(true);
    try {
      const res = miembroModal.mode === "add"
        ? await api.paginas.addMiembro("conozcanos", miembroModal.data)
        : await api.paginas.updateMiembro("conozcanos", miembroModal.id!, miembroModal.data);
      setPagina(res.pagina);
      setMiembroModal(s => ({ ...s, open: false }));
    } catch {
      alert("Error al guardar miembro.");
    } finally {
      setSavingMiembro(false);
    }
  };

  const confirmDeleteMiembro = async () => {
    if (!deleteMiembro) return;
    try {
      const res = await api.paginas.removeMiembro("conozcanos", deleteMiembro._id);
      setPagina(res.pagina);
    } catch {
      alert("Error al eliminar.");
    } finally {
      setDeleteMiembro(null);
    }
  };

  const miembros = pagina?.miembros ?? [];
  const rows: ApiMiembro[][] = [];
  for (let i = 0; i < miembros.length; i += 3) rows.push(miembros.slice(i, i + 3));

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }} className="p-8">
      <AdminTitle title="Imágenes — Conózcanos" subtitle="Administra el contenido y equipo de la página conózcanos." />

      {loading ? (
        <p className="font-serif text-center py-20" style={{ color: "var(--coffee)", opacity: .5 }}>Cargando...</p>
      ) : (
        <div className="space-y-12 max-w-3xl">

          {/* Secciones */}
          <div>
            <h3 className="font-script text-3xl mb-5" style={{ color: "var(--coffee)" }}>Secciones</h3>
            <div className="space-y-6">
              {SECCIONES_DEF.map(({ slug, label }, i) => (
                <div key={slug} className="rounded-xl border p-5 space-y-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                  <p className="font-serif font-semibold text-sm" style={{ color: "var(--coffee)" }}>{label}</p>
                  <div>
                    <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)", opacity: .6 }}>Texto</label>
                    <textarea rows={3} className={inputCls() + " resize-none"} style={inputStyle()} value={secciones[i]?.texto ?? ""}
                      onChange={e => setSecciones(prev => prev.map((x, j) => j === i ? { ...x, texto: e.target.value } : x))} />
                  </div>
                  <ImageUpload
                    value={secciones[i]?.imagen}
                    onChange={url => setSecciones(prev => prev.map((x, j) => j === i ? { ...x, imagen: url } : x))}
                  />
                </div>
              ))}
            </div>
            <button onClick={saveSecciones} disabled={savingSec} className="mt-4 px-5 py-2 rounded-lg font-serif text-sm text-white disabled:opacity-50" style={{ background: "var(--forest)" }}>
              {savingSec ? "Guardando..." : "Guardar secciones"}
            </button>
          </div>

          {/* Miembros */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-script text-3xl" style={{ color: "var(--coffee)" }}>Nuestra Familia</h3>
              <button onClick={() => setMiembroModal({ open: true, mode: "add", data: blankMiembro() })}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-serif text-sm"
                style={{ background: "var(--forest)", color: "var(--cream)" }}>
                <Plus size={14} /> Añadir miembro
              </button>
            </div>

            {miembros.length === 0 && (
              <p className="font-serif text-center py-10" style={{ color: "var(--coffee)", opacity: .4 }}>No hay miembros registrados.</p>
            )}

            {rows.map((row, ri) => (
              <div key={ri} className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                {row.map(m => (
                  <div key={m._id} className="rounded-xl border p-5 text-center relative" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                    <div className="absolute top-3 right-3 flex gap-1">
                      <button onClick={() => setMiembroModal({ open: true, mode: "edit", id: m._id, data: { nombre: m.nombre, rol: m.rol, descripcion: m.descripcion, iniciales: m.iniciales, imagen: m.imagen ?? "" } })}
                        className="p-1.5 rounded-lg" style={{ background: "var(--tan)" }}>
                        <Pencil size={12} style={{ color: "var(--coffee)" }} />
                      </button>
                      <button onClick={() => setDeleteMiembro(m)} className="p-1.5 rounded-lg" style={{ background: "var(--tan)" }}>
                        <Trash2 size={12} style={{ color: "var(--coffee)" }} />
                      </button>
                    </div>
                    {m.imagen
                      ? <img src={m.imagen} alt={m.nombre} className="w-20 h-20 rounded-full object-cover mx-auto mb-3" />
                      : <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-serif mx-auto mb-3" style={{ background: "var(--forest)", color: "var(--cream)" }}>{m.iniciales}</div>
                    }
                    <p className="font-serif font-semibold text-sm" style={{ color: "var(--coffee)" }}>{m.nombre}</p>
                    <p className="font-serif text-xs mt-0.5" style={{ color: "var(--forest)" }}>{m.rol}</p>
                    <p className="font-serif text-xs mt-2 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{m.descripcion}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Modal miembro */}
          <Dialog open={miembroModal.open} onClose={() => setMiembroModal(s => ({ ...s, open: false }))} title={miembroModal.mode === "edit" ? "Editar miembro" : "Añadir miembro"}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Nombre</label>
                  <input className={inputCls()} style={inputStyle()} value={miembroModal.data.nombre}
                    onChange={e => setMiembroModal(s => ({ ...s, data: { ...s.data, nombre: e.target.value } }))} />
                </div>
                <div>
                  <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Iniciales</label>
                  <input className={inputCls()} style={inputStyle()} value={miembroModal.data.iniciales} maxLength={3}
                    onChange={e => setMiembroModal(s => ({ ...s, data: { ...s.data, iniciales: e.target.value } }))} />
                </div>
              </div>
              <div>
                <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Rol</label>
                <input className={inputCls()} style={inputStyle()} value={miembroModal.data.rol}
                  onChange={e => setMiembroModal(s => ({ ...s, data: { ...s.data, rol: e.target.value } }))} />
              </div>
              <div>
                <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Descripción</label>
                <textarea rows={3} className={inputCls() + " resize-none"} style={inputStyle()} value={miembroModal.data.descripcion}
                  onChange={e => setMiembroModal(s => ({ ...s, data: { ...s.data, descripcion: e.target.value } }))} />
              </div>
              <ImageUpload value={miembroModal.data.imagen} onChange={img => setMiembroModal(s => ({ ...s, data: { ...s.data, imagen: img } }))} />
              <div className="flex justify-end gap-3 pt-2">
                <button className="px-5 py-2 rounded-lg font-serif text-sm border" style={{ borderColor: "var(--tan-dark)", color: "var(--coffee)" }}
                  onClick={() => setMiembroModal(s => ({ ...s, open: false }))}>Cancelar</button>
                <button className="px-5 py-2 rounded-lg font-serif text-sm text-white disabled:opacity-50" style={{ background: "var(--forest)" }}
                  disabled={savingMiembro} onClick={saveMiembro}>
                  {savingMiembro ? "Guardando..." : miembroModal.mode === "edit" ? "Guardar Cambios" : "Guardar"}
                </button>
              </div>
            </div>
          </Dialog>

          <ConfirmDialog
            open={!!deleteMiembro}
            message={`¿Segur@ que desea eliminar a ${deleteMiembro?.nombre}?`}
            onCancel={() => setDeleteMiembro(null)}
            onConfirm={confirmDeleteMiembro}
          />
        </div>
      )}
    </div>
  );
}