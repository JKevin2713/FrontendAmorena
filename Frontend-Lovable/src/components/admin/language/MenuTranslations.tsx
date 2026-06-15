import { Field, Input, Textarea } from "@/components/admin/ui";
import type { LanguageMenuCategory, LanguageMenuFilter, LanguageMenuProduct } from "@/lib/language/admin";
import { CollapsibleSection } from "./CollapsibleSection";
import { SaveTranslationButton } from "./SaveTranslationButton";
import type { Drafts, SaveState } from "./types";

type MenuTranslationsProps = {
  products: LanguageMenuProduct[];
  categories: LanguageMenuCategory[];
  filters: LanguageMenuFilter[];
  drafts: Drafts;
  setDraft: (key: string, value: string) => void;
  saveState: SaveState;
  onSaveProduct: (item: LanguageMenuProduct) => void;
  onSaveCategory: (item: LanguageMenuCategory) => void;
  onSaveFilter: (item: LanguageMenuFilter) => void;
};

function TextPair({
  originalLabel,
  translationLabel,
  original,
  draftKey,
  drafts,
  setDraft,
  long = false,
}: {
  originalLabel: string;
  translationLabel: string;
  original: string;
  draftKey: string;
  drafts: Drafts;
  setDraft: (key: string, value: string) => void;
  long?: boolean;
}) {
  const Control = long ? Textarea : Input;
  return (
    <>
      <Field label={originalLabel}>
        <Control value={original} readOnly className={long ? "min-h-[100px]" : undefined} />
      </Field>
      <Field label={translationLabel}>
        <Control value={drafts[draftKey] ?? ""} onChange={(event) => setDraft(draftKey, event.target.value)} className={long ? "min-h-[100px]" : undefined} />
      </Field>
    </>
  );
}

export function MenuTranslations({
  products,
  categories,
  filters,
  drafts,
  setDraft,
  saveState,
  onSaveProduct,
  onSaveCategory,
  onSaveFilter,
}: MenuTranslationsProps) {
  return (
    <>
      <CollapsibleSection
        title="Productos"
        subtitle="Nombres y descripciones de los platillos y bebidas que aparecen en el menú público."
      >
        {products.length === 0 ? (
          <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>No hay productos registrados.</p>
        ) : (
          <div className="grid gap-5">
            {products.map((item) => {
              const saveKey = `menuProduct:${item._id}`;
              return (
                <div key={item._id} className="grid gap-3 border-t pt-4" style={{ borderColor: "var(--tan-dark)" }}>
                  <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
                    {[item.categoria, typeof item.precio === "number" ? `₡${item.precio.toLocaleString("es-CR")}` : ""].filter(Boolean).join(" - ")}
                  </p>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <TextPair
                      originalLabel="Nombre original"
                      translationLabel="Nombre en inglés"
                      original={item.nombre}
                      draftKey={`menuProduct:${item._id}:nombre_en`}
                      drafts={drafts}
                      setDraft={setDraft}
                    />
                    <TextPair
                      originalLabel="Descripción original"
                      translationLabel="Descripción en inglés"
                      original={item.descripcion ?? ""}
                      draftKey={`menuProduct:${item._id}:descripcion_en`}
                      drafts={drafts}
                      setDraft={setDraft}
                      long
                    />
                  </div>
                  <div className="flex justify-end">
                    <SaveTranslationButton state={saveState[saveKey]} onClick={() => onSaveProduct(item)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Categorías"
        subtitle="Nombres de los grupos del menú, como bebidas, postres o desayunos."
      >
        {categories.length === 0 ? (
          <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>No hay categorías registradas.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {categories.map((item) => {
              const saveKey = `menuCategory:${item._id}`;
              return (
                <div key={item._id} className="rounded-lg border p-4" style={{ borderColor: "var(--tan-dark)" }}>
                  <div className="grid gap-3">
                    <TextPair
                      originalLabel="Categoría original"
                      translationLabel="Categoría en inglés"
                      original={item.nombre}
                      draftKey={`menuCategory:${item._id}:nombre_en`}
                      drafts={drafts}
                      setDraft={setDraft}
                    />
                    <TextPair
                      originalLabel="Descripción original"
                      translationLabel="Descripción en inglés"
                      original={item.descripcion ?? ""}
                      draftKey={`menuCategory:${item._id}:descripcion_en`}
                      drafts={drafts}
                      setDraft={setDraft}
                      long
                    />
                  </div>
                  <div className="flex justify-end mt-3">
                    <SaveTranslationButton state={saveState[saveKey]} onClick={() => onSaveCategory(item)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Filtros"
        subtitle="Opciones que ayudan a los clientes a encontrar productos del menú según sus preferencias."
      >
        {filters.length === 0 ? (
          <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>No hay filtros registrados.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filters.map((item) => {
              const saveKey = `menuFilter:${item._id}`;
              return (
                <div key={item._id} className="rounded-lg border p-4" style={{ borderColor: "var(--tan-dark)" }}>
                  <div className="grid gap-3">
                    <TextPair
                      originalLabel="Filtro original"
                      translationLabel="Filtro en inglés"
                      original={item.nombre}
                      draftKey={`menuFilter:${item._id}:nombre_en`}
                      drafts={drafts}
                      setDraft={setDraft}
                    />
                    <TextPair
                      originalLabel="Descripción original"
                      translationLabel="Descripción en inglés"
                      original={item.descripcion ?? ""}
                      draftKey={`menuFilter:${item._id}:descripcion_en`}
                      drafts={drafts}
                      setDraft={setDraft}
                      long
                    />
                  </div>
                  <div className="flex justify-end mt-3">
                    <SaveTranslationButton state={saveState[saveKey]} onClick={() => onSaveFilter(item)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleSection>
    </>
  );
}
