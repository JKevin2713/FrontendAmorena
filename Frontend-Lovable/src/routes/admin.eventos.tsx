import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CalendarDays, Pencil, Star, Trash2, X } from "lucide-react";
import { AdminTitle } from "@/components/admin/AdminLayout";
import { Btn, Card, Modal } from "@/components/admin/ui";
import { api, ApiEvento } from "@/lib/api";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const Route = createFileRoute("/admin/eventos")({ component: Page });

const EVENT_CATEGORIES = ["Música", "Taller", "Cata", "Mercado", "Otro"];

function fmtDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return `${parseInt(day)} ${months[parseInt(m) - 1]}, ${y}`;
}

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
    <Modal open={open} onClose={onCancel} title="Eliminar evento">
      <p className="font-serif mb-6" style={{ color: "var(--coffee)" }}>{message}</p>
      <div className="mt-4 flex gap-2 justify-end">
        <Btn variant="outline" onClick={onCancel}>Cancelar</Btn>
        <Btn variant="danger" onClick={onConfirm}>Eliminar</Btn>
      </div>
    </Modal>
  );
}

type EventoForm = { nombre: string; fecha: string; hora: string; categoria: string; descripcion: string; imagen: string; destacado: boolean; };
const blank = (): EventoForm => ({ nombre: "", fecha: "", hora: "", categoria: "Otro", descripcion: "", imagen: "", destacado: false });

function Page() {
  const [items,   setItems]   = useState<ApiEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [modal,   setModal]   = useState<{ open: boolean; mode: "add" | "edit"; id?: string; data: EventoForm }>({ open: false, mode: "add", data: blank() });
  const [deleteEvt, setDeleteEvt] = useState<ApiEvento | null>(null);

  useEffect(() => {
    api.eventos.getAll()
      .then(res => setItems(res.eventos))
      .finally(() => setLoading(false));
  }, []);

  const openAdd  = () => setModal({ open: true, mode: "add", data: blank() });
  const openEdit = (e: ApiEvento) => setModal({
    open: true, mode: "edit", id: e._id,
    data: { nombre: e.nombre, fecha: e.fecha ?? "", hora: e.hora ?? "", categoria: e.categoria === "Destacado" ? "Otro" : e.categoria ?? "Otro", descripcion: e.descripcion ?? "", imagen: e.imagen ?? "", destacado: e.destacado ?? false }
  });

  const save = async () => {
    if (!modal.data.nombre) return;
    setSaving(true);
    try {
      const data = {
        ...modal.data,
        categoria: modal.data.categoria === "Destacado" ? "Otro" : modal.data.categoria,
      };

      if (modal.mode === "add") {
        const res = await api.eventos.create(data);
        setItems(prev => [res.evento, ...prev]);
      } else {
        const res = await api.eventos.update(modal.id!, data);
        setItems(prev => prev.map(x => x._id === modal.id ? res.evento : x));
      }
      setModal(s => ({ ...s, open: false }));
    } catch {
      alert("Error al guardar el evento.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteEvt) return;
    try {
      await api.eventos.remove(deleteEvt._id);
      setItems(prev => prev.filter(x => x._id !== deleteEvt._id));
    } catch {
      alert("Error al eliminar el evento.");
    } finally {
      setDeleteEvt(null);
    }
  };

  return (
    <div>
      <AdminTitle title="Gestor de Eventos" subtitle="Administra los eventos en la cafetería" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif" style={{ color: "var(--coffee)" }}>Eventos actuales</h2>
          <p className="text-sm font-serif" style={{ color: "var(--muted-foreground)" }}>
            Revisa y actualiza los eventos que se muestran en el sitio.
          </p>
        </div>
        <Btn onClick={openAdd}>
          + Añadir evento
        </Btn>
      </div>

      <Card className="p-4">
      {loading && <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>Cargando eventos...</p>}

      <div className="space-y-2">
        {items.map(e => (
          <article key={e._id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: "var(--cream)" }}>
            <div className="size-16 shrink-0 overflow-hidden rounded" style={{ background: "var(--tan)" }}>
              {e.imagen
                ? <img src={e.imagen} alt={e.nombre} className="h-full w-full object-cover" />
                : <div className="h-full w-full flex items-center justify-center font-serif text-[11px]" style={{ color: "var(--coffee)", opacity: .45 }}>Sin imagen</div>
              }
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-serif font-semibold wrap-break-word" style={{ color: "var(--coffee)" }}>{e.nombre}</h3>
              <div className="font-serif text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                {e.descripcion && <p className="mt-1 line-clamp-2 wrap-break-word">{e.descripcion}</p>}
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {e.fecha && <span>{fmtDate(e.fecha)}</span>}
                  {e.hora && <><span aria-hidden="true">·</span><span>{e.hora}</span></>}
                  {e.categoria && e.categoria !== "Destacado" && <><span aria-hidden="true">·</span><span>{e.categoria}</span></>}
                  {e.destacado && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1" style={{ color: "var(--forest)" }}>
                        <Star size={12} fill="currentColor" strokeWidth={1.8} />
                        Destacado
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => openEdit(e)} className="p-1" style={{ color: "var(--forest)" }} aria-label={`Editar ${e.nombre}`} title="Editar">
                <Pencil size={16} />
              </button>
              <button type="button" onClick={() => setDeleteEvt(e)} className="p-1" style={{ color: "var(--destructive)" }} aria-label={`Eliminar ${e.nombre}`} title="Eliminar">
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
        {!loading && items.length === 0 && (
          <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>No hay eventos registrados.</p>
        )}
      </div>
      </Card>

      <Dialog open={modal.open} onClose={() => setModal(s => ({ ...s, open: false }))} title={modal.mode === "edit" ? "Editar evento" : "Añadir evento"}>
        <div className="space-y-4">
          <div>
            <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Fecha</label>
            <input type="date" className={inputCls()} style={inputStyle()} value={modal.data.fecha}
              onChange={e => setModal(s => ({ ...s, data: { ...s.data, fecha: e.target.value } }))} />
            {modal.data.fecha && (
              <div className="mt-1 px-3 py-2 rounded-lg font-serif text-sm" style={{ background: "var(--card)", border: "1px solid var(--tan-dark)", color: "var(--coffee)" }}>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={14} style={{ color: "var(--forest)" }} />
                  {fmtDate(modal.data.fecha)}
                </span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Nombre</label>
              <input className={inputCls()} style={inputStyle()} value={modal.data.nombre}
                onChange={e => setModal(s => ({ ...s, data: { ...s.data, nombre: e.target.value } }))} />
            </div>
            <div>
              <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Hora</label>
              <input type="time" className={inputCls()} style={inputStyle()} value={modal.data.hora}
                onChange={e => setModal(s => ({ ...s, data: { ...s.data, hora: e.target.value } }))} />
            </div>
          </div>
          <div>
            <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Categoría</label>
            <select className={inputCls()} style={inputStyle()} value={modal.data.categoria}
              onChange={e => setModal(s => ({ ...s, data: { ...s.data, categoria: e.target.value } }))}>
              {EVENT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="font-serif text-xs font-semibold mb-1 block" style={{ color: "var(--coffee)" }}>Descripción</label>
            <textarea rows={4} className={inputCls() + " resize-none"} style={inputStyle()} value={modal.data.descripcion}
              onChange={e => setModal(s => ({ ...s, data: { ...s.data, descripcion: e.target.value } }))} />
          </div>
          <label className="flex items-center gap-2 font-serif text-sm" style={{ color: "var(--coffee)" }}>
            <input type="checkbox" checked={modal.data.destacado}
              onChange={e => setModal(s => ({ ...s, data: { ...s.data, destacado: e.target.checked } }))} />
            Marcar como destacado
          </label>
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
        open={!!deleteEvt}
        message={`¿Segur@ que desea eliminar el evento ${deleteEvt?.nombre}?`}
        onCancel={() => setDeleteEvt(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
