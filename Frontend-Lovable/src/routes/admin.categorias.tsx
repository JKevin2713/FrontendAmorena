import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { AdminTitle } from "@/components/admin/AdminLayout";
import { Btn, Card, Field, Input, Modal, Textarea } from "@/components/admin/ui";
import { useMenuCategories, type MenuCategory } from "@/lib/menu-categories";

export const Route = createFileRoute("/admin/categorias")({ component: Page });

type CategoryForm = {
  id?: string;
  name: string;
  visible: boolean;
  description: string;
  order: number;
};

type ConfirmState = { id: string; name: string };

function nextOrder(items: MenuCategory[]) {
  return items.length ? Math.max(...items.map((item) => item.order)) + 1 : 1;
}

function Page() {
  const { items, loading, error, addCategory, editCategory, removeCategory } = useMenuCategories();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CategoryForm | null>(null);
  const [confirming, setConfirming] = useState<ConfirmState | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingDelete, setSavingDelete] = useState(false);
  const [actionError, setActionError] = useState("");

  const [form, setForm] = useState<CategoryForm>({
    name: "",
    visible: true,
    description: "",
    order: 1,
  });

  const canSave = form.name.trim().length > 0;
  const canEdit = !!editing && editing.name.trim().length > 0;

  const openCreate = () => {
    setActionError("");
    setForm({ name: "", visible: true, description: "", order: nextOrder(items) });
    setCreating(true);
  };

  const openEdit = (item: MenuCategory) => {
    setActionError("");
    setEditing({
      id: item.id,
      name: item.name,
      visible: item.visible,
      description: item.description,
      order: item.order,
    });
  };

  const saveNew = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setActionError("");
    try {
      await addCategory({
        name: form.name.trim(),
        visible: form.visible,
        description: form.description.trim(),
        order: Number(form.order) || nextOrder(items),
      });
      setCreating(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo guardar la categoría.");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!canEdit || saving || !editing?.id) return;
    setSaving(true);
    setActionError("");
    try {
      await editCategory({
        id: editing.id,
        name: editing.name.trim(),
        visible: editing.visible,
        description: editing.description.trim(),
        order: Number(editing.order) || 1,
      });
      setEditing(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo actualizar la categoría.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirming || savingDelete) return;
    setSavingDelete(true);
    setActionError("");
    try {
      await removeCategory(confirming.id);
      setConfirming(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo eliminar la categoría.");
    } finally {
      setSavingDelete(false);
    }
  };

  return (
    <div>
      <AdminTitle title="Categorías del menú" subtitle="Define las secciones que se muestran en el menú público." />

      {(error || actionError) && (
        <p className="mb-4 text-sm font-serif" style={{ color: "var(--destructive)" }}>
          {actionError || error}
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif" style={{ color: "var(--coffee)" }}>Categorías actuales</h2>
          <p className="text-sm font-serif" style={{ color: "var(--muted-foreground)" }}>
            El orden controla cómo aparecen las secciones en el menú del sitio.
          </p>
        </div>
        <Btn onClick={openCreate}>+ Nueva categoría</Btn>
      </div>

      <Card className="p-4">
        {loading ? (
          <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
            Cargando categorías...
          </p>
        ) : items.length === 0 ? (
          <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
            No hay categorías registradas.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg px-3 py-2"
                style={{ background: "var(--cream)" }}
              >
                <div className="w-12 shrink-0 text-sm font-serif pt-0.5" style={{ color: "var(--coffee)", opacity: 0.7 }}>
                  #{item.order}
                </div>
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
                    {item.visible ? "Visible" : "Oculta"}
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
                    onClick={() => {
                      setActionError("");
                      setConfirming({ id: item.id, name: item.name });
                    }}
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

      <Modal open={creating} onClose={() => setCreating(false)} title="Crear categoría">
        <Field label="Nombre">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Orden">
          <Input type="number" min={1} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
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
          <Btn disabled={!canSave || saving} onClick={saveNew}>Guardar cambios</Btn>
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar categoría">
        {editing && (
          <>
            <Field label="Nombre">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="Orden">
              <Input type="number" min={1} value={editing.order} onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} />
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
              <Btn disabled={!canEdit || saving} onClick={saveEdit}>Guardar cambios</Btn>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!confirming} onClose={() => setConfirming(null)} title="Eliminar categoría">
        {confirming && (
          <>
            <p className="font-serif mb-6" style={{ color: "var(--coffee)" }}>
              ¿Seguro que deseas eliminar la categoría "{confirming.name}"? Esta acción no se puede deshacer.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <Btn variant="outline" onClick={() => setConfirming(null)}>Cancelar</Btn>
              <Btn variant="danger" disabled={savingDelete} onClick={confirmDelete}>Eliminar</Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
