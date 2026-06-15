import { Field, Input } from "@/components/admin/ui";
import type { LanguageRegularSchedule } from "@/lib/language/admin";
import { CollapsibleSection } from "./CollapsibleSection";
import { SaveTranslationButton } from "./SaveTranslationButton";
import type { Drafts, SaveState } from "./types";

type RegularScheduleTranslationsProps = {
  items: LanguageRegularSchedule[];
  drafts: Drafts;
  setDraft: (key: string, value: string) => void;
  saveState: SaveState;
  onSave: (item: LanguageRegularSchedule) => void;
};

export function RegularScheduleTranslations({ items, drafts, setDraft, saveState, onSave }: RegularScheduleTranslationsProps) {
  return (
    <CollapsibleSection
      title="Horario regular"
      subtitle="Nombres de los días que aparecen junto al horario habitual de atención."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => {
          const draftKey = `regular:${item._id}:dia_en`;
          const saveKey = `regular:${item._id}`;
          return (
            <div key={item._id} className="rounded-lg border p-4" style={{ borderColor: "var(--tan-dark)" }}>
              <p className="font-serif text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
                {item.hora_apertura} - {item.hora_cierre}
              </p>
              <Field label="Día original">
                <Input value={item.dia} readOnly />
              </Field>
              <Field label="Día en inglés">
                <Input value={drafts[draftKey] ?? ""} onChange={(event) => setDraft(draftKey, event.target.value)} />
              </Field>
              <div className="flex justify-end">
                <SaveTranslationButton state={saveState[saveKey]} onClick={() => onSave(item)} />
              </div>
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
