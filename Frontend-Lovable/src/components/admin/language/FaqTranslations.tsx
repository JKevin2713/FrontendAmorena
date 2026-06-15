import { Field, Textarea } from "@/components/admin/ui";
import type { LanguageFaq } from "@/lib/language/admin";
import { CollapsibleSection } from "./CollapsibleSection";
import { SaveTranslationButton } from "./SaveTranslationButton";
import type { Drafts, SaveState } from "./types";

type FaqTranslationsProps = {
  items: LanguageFaq[];
  drafts: Drafts;
  setDraft: (key: string, value: string) => void;
  saveState: SaveState;
  onSave: (item: LanguageFaq) => void;
};

export function FaqTranslations({ items, drafts, setDraft, saveState, onSave }: FaqTranslationsProps) {
  return (
    <CollapsibleSection
      title="Preguntas dinámicas"
      subtitle="Preguntas y respuestas que se muestran a los clientes en la página de preguntas frecuentes."
    >
      {items.length === 0 ? (
        <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>No hay preguntas registradas.</p>
      ) : (
        <div className="grid gap-5">
          {items.map((item) => {
            const saveKey = `faq:${item._id}`;
            return (
              <div key={item._id} className="grid gap-3 border-t pt-4" style={{ borderColor: "var(--tan-dark)" }}>
                <div className="grid gap-3 lg:grid-cols-2">
                  <Field label="Pregunta original">
                    <Textarea value={item.pregunta} readOnly />
                  </Field>
                  <Field label="Pregunta en inglés">
                    <Textarea
                      value={drafts[`faq:${item._id}:pregunta_en`] ?? ""}
                      onChange={(event) => setDraft(`faq:${item._id}:pregunta_en`, event.target.value)}
                    />
                  </Field>
                  <Field label="Respuesta original">
                    <Textarea value={item.respuesta} readOnly className="min-h-[120px]" />
                  </Field>
                  <Field label="Respuesta en inglés">
                    <Textarea
                      value={drafts[`faq:${item._id}:respuesta_en`] ?? ""}
                      onChange={(event) => setDraft(`faq:${item._id}:respuesta_en`, event.target.value)}
                      className="min-h-[120px]"
                    />
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
