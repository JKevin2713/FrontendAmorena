import { Field, Textarea } from "@/components/admin/ui";
import type { LanguageScheduleException } from "@/lib/language/admin";
import { CollapsibleSection } from "./CollapsibleSection";
import { SaveTranslationButton } from "./SaveTranslationButton";
import type { Drafts, SaveState } from "./types";

type ExceptionTranslationsProps = {
  items: LanguageScheduleException[];
  drafts: Drafts;
  setDraft: (key: string, value: string) => void;
  saveState: SaveState;
  onSave: (item: LanguageScheduleException) => void;
};

export function ExceptionTranslations({ items, drafts, setDraft, saveState, onSave }: ExceptionTranslationsProps) {
  return (
    <CollapsibleSection
      title="Excepciones del mes"
      subtitle="Motivos de cierres o cambios de horario para el mes elegido."
    >
      {items.length === 0 ? (
        <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>No hay excepciones para este mes.</p>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const draftKey = `exception:${item._id}:motivo_en`;
            const saveKey = `exception:${item._id}`;
            return (
              <div key={item._id} className="grid gap-3 border-t pt-4" style={{ borderColor: "var(--tan-dark)" }}>
                <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {item.fecha} · {item.tipo === "cierre" ? "Cierre" : "Cambio de horario"}
                </p>
                <div className="grid gap-3 lg:grid-cols-2">
                  <Field label="Motivo original">
                    <Textarea value={item.motivo} readOnly />
                  </Field>
                  <Field label="Motivo en inglés">
                    <Textarea value={drafts[draftKey] ?? ""} onChange={(event) => setDraft(draftKey, event.target.value)} />
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
