import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { AdminTitle } from "@/components/admin/AdminLayout";
import { Card, Field, Input, Btn, Modal, Textarea } from "@/components/admin/ui";
import { useFilters, type FilterItem } from "@/lib/filters";

export const Route = createFileRoute("/admin/filtros")({ component: Page });

type FilterForm = {
  id?: string;
  name: string;
  visible: boolean;
  description: string;
};

type ConfirmState = { id: string; name: string };

function Page() {
  const { items, loading, error, addFilter, editFilter, removeFilter } = useFilters();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FilterForm | null>(null);
  const [confirming, setConfirming] = useState<ConfirmState | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingDelete, setSavingDelete] = useState(false);

  const [form, setForm] = useState<FilterForm>({
    name: "",
    visible: true,
    description: "",
  });

  const canSave = form.name.trim().length > 0;
  const canEdit = !!editing && editing.name.trim().length > 0;

  const openCreate = () => {
    setForm({ name: "", visible: true, description: "" });
    setCreating(true);
  };

  const openEdit = (item: FilterItem) => {
    setEditing({
      id: item.id,
      name: item.name,
      visible: item.visible,
      description: item.description,
    });
  };

  return (
    <div>
      <AdminTitle title="Filtros" subtitle="Tags simples para clasificar productos del menú." />
      {error && (
        <p className="mb-4 text-sm font-serif" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif" style={{ color: "var(--coffee)" }}>Filtros actuales</h2>
          <p className="text-sm font-serif" style={{ color: "var(--muted-foreground)" }}>
            Configura visibilidad y descripción para usarlos como tags de productos.
          </p>
        </div>
        <Btn onClick={openCreate}>+ Nuevo filtro</Btn>
      </div>

      <Card className="p-4">
        {loading ? (
          <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
            Cargando filtros...
          </p>
        ) : items.length === 0 ? (
          <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
            No hay filtros registrados.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg px-3 py-2"
                style={{ background: "var(--cream)" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-serif wrap-break-word" style={{ color: "var(--coffee)" }}>{item.name}</div>
                  {item.description && (
                    <div className="text-xs font-serif mt-1 wrap-break-word" style={{ color: "var(--muted-foreground)" }}>
                      {item.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-serif shrink-0" style={{ color: "var(--coffee)" }}>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px]"
                    style={{
                      background: item.visible ? "var(--forest)" : "var(--tan)",
                      color: item.visible ? "var(--cream)" : "var(--coffee)",
                    }}
                  >
                    {item.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    {item.visible ? "Visible" : "Oculto"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1"
                    style={{ color: "var(--forest)" }}
                    onClick={() => openEdit(item)}
                    aria-label={`Editar ${item.name}`}
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="p-1"
                    style={{ color: "var(--destructive)" }}
                    onClick={() => setConfirming({ id: item.id, name: item.name })}
                    aria-label={`Eliminar ${item.name}`}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={creating} onClose={() => setCreating(false)} title="Crear filtro">
        <Field label="Nombre">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 mb-3 font-serif" style={{ color: "var(--coffee)" }}>
          <input
            type="checkbox"
            checked={form.visible}
            onChange={(e) => setForm({ ...form, visible: e.target.checked })}
          />
          Visible al público
        </label>
        <Field label="Descripción">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="mt-4 flex gap-2 justify-end">
          <Btn variant="outline" onClick={() => setCreating(false)}>Cancelar</Btn>
          <Btn
            disabled={!canSave || saving}
            onClick={async () => {
              if (saving) return;
              setSaving(true);
              try {
                await addFilter({
                  name: form.name.trim(),
                  visible: form.visible,
                  description: form.description.trim(),
                });
                setCreating(false);
              } finally {
                setSaving(false);
              }
            }}
          >
            Guardar cambios
          </Btn>
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar filtro">
        {editing && (
          <>
            <Field label="Nombre">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 mb-3 font-serif" style={{ color: "var(--coffee)" }}>
              <input
                type="checkbox"
                checked={editing.visible}
                onChange={(e) => setEditing({ ...editing, visible: e.target.checked })}
              />
              Visible al público
            </label>
            <Field label="Descripción">
              <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </Field>
            <div className="mt-4 flex gap-2 justify-end">
              <Btn variant="outline" onClick={() => setEditing(null)}>Cancelar</Btn>
              <Btn
                disabled={!canEdit || saving}
                onClick={async () => {
                  if (saving || !editing.id) return;
                  setSaving(true);
                  try {
                    await editFilter({
                      id: editing.id,
                      name: editing.name.trim(),
                      visible: editing.visible,
                      description: editing.description.trim(),
                    });
                    setEditing(null);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Guardar cambios
              </Btn>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!confirming} onClose={() => setConfirming(null)} title="Eliminar filtro">
        {confirming && (
          <>
            <p className="font-serif mb-6" style={{ color: "var(--coffee)" }}>
              ¿Seguro que deseas eliminar el filtro "{confirming.name}"? Esta acción no se puede deshacer.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <Btn variant="outline" onClick={() => setConfirming(null)}>Cancelar</Btn>
              <Btn
                variant="danger"
                disabled={savingDelete}
                onClick={async () => {
                  if (savingDelete) return;
                  setSavingDelete(true);
                  try {
                    await removeFilter(confirming.id);
                    setConfirming(null);
                  } finally {
                    setSavingDelete(false);
                  }
                }}
              >
                Eliminar
              </Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
