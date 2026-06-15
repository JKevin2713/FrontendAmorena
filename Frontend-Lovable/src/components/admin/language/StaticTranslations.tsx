import { Field, Textarea } from "@/components/admin/ui";
import type { StaticTranslationItem } from "@/lib/language/admin";
import { CollapsibleSection } from "./CollapsibleSection";
import { SaveTranslationButton } from "./SaveTranslationButton";
import type { Drafts, SaveState } from "./types";

type StaticTranslationsProps = {
  items: StaticTranslationItem[];
  drafts: Drafts;
  setDraft: (key: string, value: string) => void;
  saveState: SaveState;
  onSave: (item: StaticTranslationItem) => void;
};

export function StaticTranslations({ items, drafts, setDraft, saveState, onSave }: StaticTranslationsProps) {
  return (
    <CollapsibleSection
      title="Texto estático"
      subtitle="Frases generales que aparecen en la sección seleccionada, como títulos, mensajes y textos de ayuda."
    >
      <div className="grid gap-4">
        {items.map((item) => {
          const draftKey = `static:${item.key}`;
          return (
            <div key={item.key} className="grid gap-3 border-t pt-4" style={{ borderColor: "var(--tan-dark)" }}>
              <Field label="Original">
                <Textarea value={item.original} readOnly className="min-h-[70px]" />
              </Field>
              <Field label="Traducción en inglés">
                <Textarea
                  value={drafts[draftKey] ?? ""}
                  onChange={(event) => setDraft(draftKey, event.target.value)}
                  className="min-h-[70px]"
                />
              </Field>
              <div className="flex justify-end">
                <SaveTranslationButton state={saveState[draftKey]} onClick={() => onSave(item)} />
              </div>
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
