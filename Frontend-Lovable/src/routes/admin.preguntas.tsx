import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Bold, Italic, Link2, List, Pencil, Trash2 } from "lucide-react";
import { AdminTitle } from "@/components/admin/AdminLayout";
import { Field, Input, Textarea, Btn, Modal } from "@/components/admin/ui";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { RichText } from "@/components/ui/rich-text";
import { useFaqs } from "@/lib/faqs";

export const Route = createFileRoute("/admin/preguntas")({ component: Page });

type EditingFaq = { id: string; q: string; a: string };

type ConfirmFaq = { id: string; q: string };

function Page() {
  const { items, loading, error, addFaq, editFaq, removeFaq } = useFaqs();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ q: "", a: "" });
  const [editing, setEditing] = useState<EditingFaq | null>(null);
  const [confirming, setConfirming] = useState<ConfirmFaq | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingDelete, setSavingDelete] = useState(false);
  const createAnswerRef = useRef<HTMLTextAreaElement | null>(null);
  const editAnswerRef = useRef<HTMLTextAreaElement | null>(null);

  const canSave = form.q.trim().length > 0 && form.a.trim().length > 0;
  const canEdit = !!editing && editing.q.trim().length > 0 && editing.a.trim().length > 0;

  const applyFormat = (
    value: string,
    setValue: (next: string) => void,
    ref: React.RefObject<HTMLTextAreaElement | null>,
    type: "bold" | "italic" | "link" | "list",
  ) => {
    const target = ref.current;
    const start = target?.selectionStart ?? value.length;
    const end = target?.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || (type === "link" ? "texto" : "texto");

    let insert = "";
    if (type === "bold") insert = `**${selected}**`;
    if (type === "italic") insert = `*${selected}*`;
    if (type === "link") insert = `[${selected}](https://)`;
    if (type === "list") {
      const lines = (selected || "item").split("\n");
      insert = lines.map((line) => `- ${line.replace(/^[-*]\s+/, "")}`).join("\n");
    }

    const next = `${value.slice(0, start)}${insert}${value.slice(end)}`;
    setValue(next);

    requestAnimationFrame(() => {
      if (!target) return;
      const cursor = start + insert.length;
      target.focus();
      target.setSelectionRange(cursor, cursor);
    });
  };

  const formatForm = (type: "bold" | "italic" | "link" | "list") =>
    applyFormat(form.a, (next) => setForm({ ...form, a: next }), createAnswerRef, type);

  const formatEditing = (type: "bold" | "italic" | "link" | "list") => {
    if (!editing) return;
    applyFormat(editing.a, (next) => setEditing({ ...editing, a: next }), editAnswerRef, type);
  };

  return (
    <div>
      <AdminTitle
        title="Preguntas frecuentes"
        subtitle="Gestiona el centro de ayuda y mantiene clara la información para tus clientes."
      />
      {error && (
        <p className="mb-4 text-sm font-serif" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif" style={{ color: "var(--coffee)" }}>Preguntas actuales</h2>
          <p className="text-sm font-serif" style={{ color: "var(--muted-foreground)" }}>
            Organiza y actualiza las respuestas visibles en la sección de clientes.
          </p>
        </div>
        <Btn onClick={() => { setForm({ q: "", a: "" }); setCreating(true); }}>+ Añadir nueva pregunta</Btn>
      </div>

      {loading ? (
        <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
          Cargando preguntas...
        </p>
      ) : items.length === 0 ? (
        <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
          No hay preguntas registradas.
        </p>
      ) : (
        <FaqAccordion
          items={items}
          renderActions={(item) => (
            <>
              <button
                type="button"
                className="p-1"
                style={{ color: "var(--forest)" }}
                onClick={() => setEditing(item)}
                aria-label={`Editar ${item.q}`}
                title="Editar"
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                className="p-1"
                style={{ color: "var(--destructive)" }}
                onClick={() => setConfirming({ id: item.id, q: item.q })}
                aria-label={`Eliminar ${item.q}`}
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        />
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Crear pregunta">
        <Field label="Pregunta"><Input value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} /></Field>
        <Field label="Respuesta">
          <div className="flex items-center gap-2 mb-2">
            <button type="button" className="p-1" style={{ color: "var(--forest)" }} onClick={() => formatForm("bold")} title="Negrita">
              <Bold size={16} />
            </button>
            <button type="button" className="p-1" style={{ color: "var(--forest)" }} onClick={() => formatForm("italic")} title="Cursiva">
              <Italic size={16} />
            </button>
            <button type="button" className="p-1" style={{ color: "var(--forest)" }} onClick={() => formatForm("link")} title="Enlace">
              <Link2 size={16} />
            </button>
            <button type="button" className="p-1" style={{ color: "var(--forest)" }} onClick={() => formatForm("list")} title="Lista">
              <List size={16} />
            </button>
          </div>
          <Textarea ref={createAnswerRef} value={form.a} onChange={(e) => setForm({ ...form, a: e.target.value })} />
        </Field>
        <p className="text-xs font-serif mb-4" style={{ color: "var(--muted-foreground)" }}>
          Puedes usar **negrita**, *cursiva*, listas con - item y enlaces con [texto](https://enlace.com).
        </p>
        <div className="mt-3">
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--muted-foreground)" }}>Vista previa</p>
          <div className="mt-2 font-serif text-sm" style={{ color: "var(--coffee)" }}>
            {form.a.trim().length > 0 ? <RichText text={form.a} /> : <span style={{ color: "var(--muted-foreground)" }}>Sin contenido.</span>}
          </div>
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <Btn variant="outline" onClick={() => setCreating(false)}>Cancelar</Btn>
          <Btn
            disabled={!canSave || saving}
            onClick={async () => {
              if (saving) return;
              setSaving(true);
              try {
                await addFaq(form);
                setCreating(false);
                setForm({ q: "", a: "" });
              } finally {
                setSaving(false);
              }
            }}
          >
            Guardar cambios
          </Btn>
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar pregunta">
        {editing && (
          <>
            <Field label="Pregunta"><Input value={editing.q} onChange={(e) => setEditing({ ...editing, q: e.target.value })} /></Field>
            <Field label="Respuesta">
              <div className="flex items-center gap-2 mb-2">
                <button type="button" className="p-1" style={{ color: "var(--forest)" }} onClick={() => formatEditing("bold")} title="Negrita">
                  <Bold size={16} />
                </button>
                <button type="button" className="p-1" style={{ color: "var(--forest)" }} onClick={() => formatEditing("italic")} title="Cursiva">
                  <Italic size={16} />
                </button>
                <button type="button" className="p-1" style={{ color: "var(--forest)" }} onClick={() => formatEditing("link")} title="Enlace">
                  <Link2 size={16} />
                </button>
                <button type="button" className="p-1" style={{ color: "var(--forest)" }} onClick={() => formatEditing("list")} title="Lista">
                  <List size={16} />
                </button>
              </div>
              <Textarea ref={editAnswerRef} value={editing.a} onChange={(e) => setEditing({ ...editing, a: e.target.value })} />
            </Field>
            <p className="text-xs font-serif mb-4" style={{ color: "var(--muted-foreground)" }}>
              Puedes usar **negrita**, *cursiva*, listas con - item y enlaces con [texto](https://enlace.com).
            </p>
            <div className="mt-3">
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--muted-foreground)" }}>Vista previa</p>
              <div className="mt-2 font-serif text-sm" style={{ color: "var(--coffee)" }}>
                {editing.a.trim().length > 0 ? <RichText text={editing.a} /> : <span style={{ color: "var(--muted-foreground)" }}>Sin contenido.</span>}
              </div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <Btn variant="outline" onClick={() => setEditing(null)}>Cancelar</Btn>
              <Btn
                disabled={!canEdit || saving}
                onClick={async () => {
                  if (saving) return;
                  setSaving(true);
                  try {
                    await editFaq(editing);
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

      <Modal open={!!confirming} onClose={() => setConfirming(null)} title="Eliminar pregunta">
        {confirming && (
          <>
            <p className="font-serif mb-6" style={{ color: "var(--coffee)" }}>
              ¿Seguro que deseas eliminar la pregunta "{confirming.q}"? Esta acción no se puede deshacer.
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
                    await removeFaq(confirming.id);
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
