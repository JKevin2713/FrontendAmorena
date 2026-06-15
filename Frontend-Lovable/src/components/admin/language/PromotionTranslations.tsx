import { Field, Input, Textarea } from "@/components/admin/ui";
import type { LanguagePromotion } from "@/lib/language/admin";
import { CollapsibleSection } from "./CollapsibleSection";
import { SaveTranslationButton } from "./SaveTranslationButton";
import type { Drafts, SaveState } from "./types";

type PromotionTranslationsProps = {
  items: LanguagePromotion[];
  drafts: Drafts;
  setDraft: (key: string, value: string) => void;
  saveState: SaveState;
  onSave: (item: LanguagePromotion) => void;
};

export function PromotionTranslations({ items, drafts, setDraft, saveState, onSave }: PromotionTranslationsProps) {
  return (
    <CollapsibleSection
      title="Promociones"
      subtitle="Textos de las promociones que ven los clientes, como nombres, detalles y botones."
    >
      {items.length === 0 ? (
        <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>No hay promociones registradas.</p>
      ) : (
        <div className="grid gap-5">
          {items.map((item) => {
            const saveKey = `promotion:${item._id}`;
            return (
              <div key={item._id} className="grid gap-3 border-t pt-4" style={{ borderColor: "var(--tan-dark)" }}>
                <div className="grid gap-3 lg:grid-cols-2">
                  <Field label="Nombre original">
                    <Input value={item.nombre} readOnly />
                  </Field>
                  <Field label="Nombre en inglés">
                    <Input value={drafts[`promotion:${item._id}:nombre_en`] ?? ""} onChange={(event) => setDraft(`promotion:${item._id}:nombre_en`, event.target.value)} />
                  </Field>
                  <Field label="Descripción original">
                    <Textarea value={item.descripcion ?? ""} readOnly />
                  </Field>
                  <Field label="Descripción en inglés">
                    <Textarea value={drafts[`promotion:${item._id}:descripcion_en`] ?? ""} onChange={(event) => setDraft(`promotion:${item._id}:descripcion_en`, event.target.value)} />
                  </Field>
                  <Field label="Detalle original">
                    <Textarea value={item.descripcion2 ?? ""} readOnly />
                  </Field>
                  <Field label="Detalle en inglés">
                    <Textarea value={drafts[`promotion:${item._id}:descripcion2_en`] ?? ""} onChange={(event) => setDraft(`promotion:${item._id}:descripcion2_en`, event.target.value)} />
                  </Field>
                  <Field label="Botón original">
                    <Input value={item.ctaLabel ?? ""} readOnly />
                  </Field>
                  <Field label="Botón en inglés">
                    <Input value={drafts[`promotion:${item._id}:ctaLabel_en`] ?? ""} onChange={(event) => setDraft(`promotion:${item._id}:ctaLabel_en`, event.target.value)} />
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
