import { Field, Textarea } from "@/components/admin/ui";
import type { LanguageReview } from "@/lib/language/admin";
import { CollapsibleSection } from "./CollapsibleSection";
import { SaveTranslationButton } from "./SaveTranslationButton";
import type { Drafts, SaveState } from "./types";

type ReviewTranslationsProps = {
  items: LanguageReview[];
  drafts: Drafts;
  setDraft: (key: string, value: string) => void;
  saveState: SaveState;
  onSave: (item: LanguageReview) => void;
};

function reviewId(item: LanguageReview) {
  return String(item._id || item.id || "");
}

export function ReviewTranslations({ items, drafts, setDraft, saveState, onSave }: ReviewTranslationsProps) {
  return (
    <CollapsibleSection
      title="Reseñas publicadas"
      subtitle="Comentarios que aparecen en la página pública de reseñas y en el inicio cuando se muestran opiniones del sitio."
    >
      {items.length === 0 ? (
        <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>No hay reseñas registradas.</p>
      ) : (
        <div className="grid gap-5">
          {items.map((item) => {
            const id = reviewId(item);
            const saveKey = `review:${id}`;
            return (
              <div key={id} className="grid gap-3 border-t pt-4" style={{ borderColor: "var(--tan-dark)" }}>
                <p className="font-serif text-sm font-semibold" style={{ color: "var(--forest)" }}>
                  {item.nombre || item.name || "Cliente"}
                </p>
                <div className="grid gap-3 lg:grid-cols-2">
                  <Field label="Reseña original">
                    <Textarea value={item.comentario || item.text || ""} readOnly className="min-h-[120px]" />
                  </Field>
                  <Field label="Reseña en inglés">
                    <Textarea value={drafts[`review:${id}:comentario_en`] ?? ""} onChange={(event) => setDraft(`review:${id}:comentario_en`, event.target.value)} className="min-h-[120px]" />
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
