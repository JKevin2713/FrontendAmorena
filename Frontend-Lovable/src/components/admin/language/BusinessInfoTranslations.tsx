import { Field, Textarea } from "@/components/admin/ui";
import type { LanguageBusinessInfo, LanguageSection } from "@/lib/language/admin";
import { CollapsibleSection } from "./CollapsibleSection";
import { SaveTranslationButton } from "./SaveTranslationButton";
import type { Drafts, SaveState } from "./types";

type BusinessInfoTranslationsProps = {
  section: Extract<LanguageSection, "home" | "footer">;
  item?: LanguageBusinessInfo;
  drafts: Drafts;
  setDraft: (key: string, value: string) => void;
  saveState: SaveState;
  onSave: (item: LanguageBusinessInfo) => void;
};

export function BusinessInfoTranslations({ section, item, drafts, setDraft, saveState, onSave }: BusinessInfoTranslationsProps) {
  if (!item) {
    return (
      <CollapsibleSection title="Información del negocio" subtitle="Textos principales del negocio que aparecen en esta parte de la página.">
        <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>No hay información registrada.</p>
      </CollapsibleSection>
    );
  }

  const fields = section === "home"
    ? [
        { key: "descripcion", label: "Descripción" },
        { key: "slogan", label: "Slogan" },
      ]
    : [{ key: "direccion", label: "Dirección" }];

  return (
    <CollapsibleSection
      title="Información del negocio"
      subtitle={section === "home" ? "Frases principales del negocio que aparecen en la pantalla de inicio." : "Dirección que aparece en el pie de página."}
    >
      <div className="grid gap-4">
        {fields.map((field) => (
          <div key={field.key} className="grid gap-3 lg:grid-cols-2">
            <Field label={`${field.label} original`}>
              <Textarea value={String(item[field.key as keyof LanguageBusinessInfo] || "")} readOnly />
            </Field>
            <Field label={`${field.label} en inglés`}>
              <Textarea value={drafts[`business:${field.key}_en`] ?? ""} onChange={(event) => setDraft(`business:${field.key}_en`, event.target.value)} />
            </Field>
          </div>
        ))}
        <div className="flex justify-end">
          <SaveTranslationButton state={saveState.businessInfo} onClick={() => onSave(item)} />
        </div>
      </div>
    </CollapsibleSection>
  );
}
