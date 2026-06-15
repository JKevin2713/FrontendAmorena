import { Field, Input, Textarea } from "@/components/admin/ui";
import type { LanguageEvent } from "@/lib/language/admin";
import { CollapsibleSection } from "./CollapsibleSection";
import { SaveTranslationButton } from "./SaveTranslationButton";
import type { Drafts, SaveState } from "./types";

type EventTranslationsProps = {
  items: LanguageEvent[];
  drafts: Drafts;
  setDraft: (key: string, value: string) => void;
  saveState: SaveState;
  onSave: (item: LanguageEvent) => void;
};

export function EventTranslations({ items, drafts, setDraft, saveState, onSave }: EventTranslationsProps) {
  return (
    <CollapsibleSection
      title="Eventos"
      subtitle="Textos de los eventos publicados, como nombres, categorías y descripciones."
    >
      {items.length === 0 ? (
        <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>No hay eventos registrados.</p>
      ) : (
        <div className="grid gap-5">
          {items.map((item) => {
            const saveKey = `event:${item._id}`;
            return (
              <div key={item._id} className="grid gap-3 border-t pt-4" style={{ borderColor: "var(--tan-dark)" }}>
                <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {[item.fecha, item.hora].filter(Boolean).join(" - ")}
                </p>
                <div className="grid gap-3 lg:grid-cols-2">
                  <Field label="Nombre original">
                    <Input value={item.nombre} readOnly />
                  </Field>
                  <Field label="Nombre en inglés">
                    <Input value={drafts[`event:${item._id}:nombre_en`] ?? ""} onChange={(event) => setDraft(`event:${item._id}:nombre_en`, event.target.value)} />
                  </Field>
                  <Field label="Categoría original">
                    <Input value={item.categoria ?? ""} readOnly />
                  </Field>
                  <Field label="Categoría en inglés">
                    <Input value={drafts[`event:${item._id}:categoria_en`] ?? ""} onChange={(event) => setDraft(`event:${item._id}:categoria_en`, event.target.value)} />
                  </Field>
                  <Field label="Descripción original">
                    <Textarea value={item.descripcion ?? ""} readOnly className="min-h-[120px]" />
                  </Field>
                  <Field label="Descripción en inglés">
                    <Textarea value={drafts[`event:${item._id}:descripcion_en`] ?? ""} onChange={(event) => setDraft(`event:${item._id}:descripcion_en`, event.target.value)} className="min-h-[120px]" />
                  </Field>
                </div>
                <div className="flex justify-end">
                  <SaveTranslationButton state={saveState[saveKey]} onClick={() => onSave(item)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleSection>
  );
}
