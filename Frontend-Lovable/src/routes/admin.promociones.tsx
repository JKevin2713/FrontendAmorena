import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { AdminTitle } from "@/components/admin/AdminLayout";
import { Btn, Card, Modal } from "@/components/admin/ui";
import { api, ApiPromocion } from "@/lib/api";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const Route = createFileRoute("/admin/promociones")({ component: Page });

function inputCls() { return "w-full px-3 py-2 rounded-lg font-serif text-sm outline-none"; }
function inputStyle() { return { background: "var(--card)", border: "1px solid var(--tan-dark)", color: "var(--coffee)" }; }

function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(47,36,29,.42)", backdropFilter: "blur(3px)" }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative rounded-lg w-full max-w-lg shadow-2xl p-6"
        style={{ background: "var(--card)", border: "1px solid var(--tan-dark)", boxShadow: "0 24px 70px rgba(47,36,29,.22)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-3xl pr-8" style={{ color: "var(--forest)" }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full size-8 inline-flex items-center justify-center"
            style={{ color: "var(--coffee)", background: "var(--cream)", border: "1px solid var(--tan-dark)" }}
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmDialog({ open, message, onCancel, onConfirm }: { open: boolean; message: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal open={open} onClose={onCancel} title="Eliminar promoción">
      <p className="font-serif mb-6" style={{ color: "var(--coffee)" }}>{message}</p>
      <div className="mt-4 flex gap-2 justify-end">
        <Btn variant="outline" onClick={onCancel}>Cancelar</Btn>
        <Btn variant="danger" onClick={onConfirm}>Eliminar</Btn>
      </div>
    </Modal>
  );
}

type PromoForm = { nombre: string; descripcion: string; descripcion2: string; link: string; imagen: string; imgDerecha: boolean; tieneCta: boolean; ctaLabel: string; };
const blank = (): PromoForm => ({ nombre: "", descripcion: "", descripcion2: "", link: "", imagen: "", imgDerecha: true, tieneCta: false, ctaLabel: "" });

function Page() {
  const [items,   setItems]   = useState<ApiPromocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [modal,   setModal]   = useState<{ open: boolean; mode: "add" | "edit"; id?: string; data: PromoForm }>({ open: false, mode: "add", data: blank() });
  const [deletePromo, setDeletePromo] = useState<ApiPromocion | null>(null);

  useEffect(() => {
    api.promociones.getAll()
      .then(res => setItems(res.promociones))
      .finally(() => setLoading(false));
  }, []);

  const openAdd  = () => setModal({ open: true, mode: "add", data: blank() });
  const openEdit = (p: ApiPromocion) => setModal({
    open: true, mode: "edit", id: p._id,
    data: { nombre: p.nombre, descripcion: p.descripcion ?? "", descripcion2: p.descripcion2 ?? "", link: p.link ?? "", imagen: p.imagen ?? "", imgDerecha: p.imgDerecha ?? true, tieneCta: p.tieneCta ?? false, ctaLabel: p.ctaLabel ?? "" }
  });

  const save = async () => {
    if (!modal.data.nombre) return;
    setSaving(true);
    try {
      if (modal.mode === "add") {
        const res = await api.promociones.create(modal.data);
        setItems(prev => [res.promocion, ...prev]);
      } else {
        const res = await api.promociones.update(modal.id!, modal.data);
        setItems(prev => prev.map(x => x._id === modal.id ? res.promocion : x));
      }
      setModal(s => ({ ...s, open: false }));
    } catch {
      alert("Error al guardar la promoción.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletePromo) return;
    try {
      await api.promociones.remove(deletePromo._id);
      setItems(prev => prev.filter(x => x._id !== deletePromo._id));
    } catch {
      alert("Error al eliminar la promoción.");
    } finally {
      setDeletePromo(null);
    }
  };

  return (
    <div>
      <AdminTitle title="Gestor de Promociones" subtitle="Administra las promociones activas en la cafetería" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif" style={{ color: "var(--coffee)" }}>Promociones actuales</h2>
          <p className="text-sm font-serif" style={{ color: "var(--muted-foreground)" }}>
            Administra las promociones que aparecen en la página principal.
          </p>
        </div>
        <Btn onClick={openAdd}>
          + Añadir promoción
        </Btn>
      </div>

      <Card className="p-4">
      {loading && <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>Cargando promociones...</p>}

      <div className="space-y-2">
        {items.map(p => (
          <article key={p._id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: "var(--cream)" }}>
            <div className="size-16 shrink-0 overflow-hidden rounded" style={{ background: "var(--tan)" }}>
              {p.imagen
                ? <img src={p.imagen} alt={p.nombre} className="h-full w-full object-cover" />
                : <div className="h-full w-full flex items-center justify-center font-serif text-[11px]" style={{ color: "var(--coffee)", opacity: .45 }}>Sin imagen</div>
              }
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-serif font-semibold wrap-break-word" style={{ color: "var(--coffee)" }}>{p.nombre}</h3>
              <div className="font-serif text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                {p.descripcion && <p className="mt-1 line-clamp-2 wrap-break-word">{p.descripcion}</p>}
                {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="mt-1 block truncate underline" style={{ color: "var(--forest)" }}>{p.link}</a>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => openEdit(p)} className="p-1" style={{ color: "var(--forest)" }} aria-label={`Editar ${p.nombre}`} title="Editar">
                <Pencil size={16} />
              </button>
              <button type="button" onClick={() => setDeletePromo(p)} className="p-1" style={{ color: "var(--destructive)" }} aria-label={`Eliminar ${p.nombre}`} title="Eliminar">
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
        {!loading && items.length === 0 && (
          <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>No hay promociones registradas.</p>
        )}
      </div>
      </Card>

      <Dialog open={modal.open} onClose={() => setModal(s => ({ ...s, open: false }))} title={modal.mode === "edit" ? "Editar promoción" : "Añadir promoción"}>
        <div className="space-y-4">
          <div>
            <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Nombre</label>
            <input className={inputCls()} style={inputStyle()} value={modal.data.nombre}
              onChange={e => setModal(s => ({ ...s, data: { ...s.data, nombre: e.target.value } }))} />
          </div>
          <div>
            <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Descripción</label>
            <textarea rows={3} className={inputCls() + " resize-none"} style={inputStyle()} value={modal.data.descripcion}
              onChange={e => setModal(s => ({ ...s, data: { ...s.data, descripcion: e.target.value } }))} />
          </div>
          <div>
            <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Descripción adicional</label>
            <textarea rows={3} className={inputCls() + " resize-none"} style={inputStyle()} value={modal.data.descripcion2}
              onChange={e => setModal(s => ({ ...s, data: { ...s.data, descripcion2: e.target.value } }))} />
          </div>
          <div>
            <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Link</label>
            <input className={inputCls()} style={inputStyle()} value={modal.data.link}
              onChange={e => setModal(s => ({ ...s, data: { ...s.data, link: e.target.value } }))} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 font-serif text-sm" style={{ color: "var(--coffee)" }}>
              <input type="checkbox" checked={modal.data.imgDerecha}
                onChange={e => setModal(s => ({ ...s, data: { ...s.data, imgDerecha: e.target.checked } }))} />
              Imagen a la derecha
            </label>
            <label className="flex items-center gap-2 font-serif text-sm" style={{ color: "var(--coffee)" }}>
              <input type="checkbox" checked={modal.data.tieneCta}
                onChange={e => setModal(s => ({ ...s, data: { ...s.data, tieneCta: e.target.checked } }))} />
              Mostrar botón de acción
            </label>
          </div>
          {modal.data.tieneCta && (
            <div>
              <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Texto del botón</label>
              <input className={inputCls()} style={inputStyle()} value={modal.data.ctaLabel}
                onChange={e => setModal(s => ({ ...s, data: { ...s.data, ctaLabel: e.target.value } }))} />
            </div>
          )}
          <ImageUpload value={modal.data.imagen} onChange={img => setModal(s => ({ ...s, data: { ...s.data, imagen: img } }))} />
          <div className="flex justify-end gap-3 pt-2">
            <button className="px-5 py-2 rounded-lg font-serif text-sm border" style={{ borderColor: "var(--tan-dark)", color: "var(--coffee)" }}
              onClick={() => setModal(s => ({ ...s, open: false }))}>Cancelar</button>
            <button className="px-5 py-2 rounded-lg font-serif text-sm text-white" style={{ background: "var(--forest)" }}
              disabled={saving} onClick={save}>{saving ? "Guardando..." : modal.mode === "edit" ? "Guardar Cambios" : "Guardar"}</button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deletePromo}
        message={`¿Segur@ que desea eliminar la promoción ${deletePromo?.nombre}?`}
        onCancel={() => setDeletePromo(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
