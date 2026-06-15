import { Field, Input, Textarea } from "@/components/admin/ui";
import type { LanguagePageMember, LanguagePageSection } from "@/lib/language/admin";
import { CollapsibleSection } from "./CollapsibleSection";
import { SaveTranslationButton } from "./SaveTranslationButton";
import type { Drafts, SaveState } from "./types";

type PageTranslationsProps = {
  sectionTitle?: string;
  sectionSubtitle?: string;
  memberTitle?: string;
  memberSubtitle?: string;
  pageSections: LanguagePageSection[];
  pageMembers?: LanguagePageMember[];
  drafts: Drafts;
  setDraft: (key: string, value: string) => void;
  saveState: SaveState;
  onSaveSection: (item: LanguagePageSection) => void;
  onSaveMember?: (item: LanguagePageMember) => void;
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
        <Control
          value={drafts[draftKey] ?? ""}
          onChange={(event) => setDraft(draftKey, event.target.value)}
          className={long ? "min-h-[100px]" : undefined}
        />
      </Field>
    </>
  );
}

export function PageTranslations({
  sectionTitle = "Contenido de la pagina",
  sectionSubtitle = "Titulos y parrafos que los clientes leen en esta parte del sitio.",
  memberTitle = "Personas del equipo",
  memberSubtitle = "Puestos y descripciones de las personas que aparecen en Conozcanos.",
  pageSections,
  pageMembers = [],
  drafts,
  setDraft,
  saveState,
  onSaveSection,
  onSaveMember,
}: PageTranslationsProps) {
  return (
    <>
      <CollapsibleSection title={sectionTitle} subtitle={sectionSubtitle}>
        {pageSections.length === 0 ? (
          <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
            No hay contenido registrado para traducir.
          </p>
        ) : (
          <div className="grid gap-5">
            {pageSections.map((item) => {
              const saveKey = `pageSection:${item.slug}`;
              return (
                <div key={item.slug} className="grid gap-3 border-t pt-4" style={{ borderColor: "var(--tan-dark)" }}>
                  <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Bloque: {item.slug}
                  </p>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <TextPair
                      originalLabel="Titulo original"
                      translationLabel="Titulo en ingles"
                      original={item.titulo ?? ""}
                      draftKey={`pageSection:${item.slug}:titulo_en`}
                      drafts={drafts}
                      setDraft={setDraft}
                    />
                    <TextPair
                      originalLabel="Texto original"
                      translationLabel="Texto en ingles"
                      original={item.texto ?? ""}
                      draftKey={`pageSection:${item.slug}:texto_en`}
                      drafts={drafts}
                      setDraft={setDraft}
                      long
                    />
                  </div>
                  <div className="flex justify-end">
                    <SaveTranslationButton state={saveState[saveKey]} onClick={() => onSaveSection(item)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleSection>

      {onSaveMember && (
        <CollapsibleSection title={memberTitle} subtitle={memberSubtitle}>
          {pageMembers.length === 0 ? (
            <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
              No hay personas registradas para traducir.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pageMembers.map((item) => {
                const saveKey = `pageMember:${item._id}`;
                return (
                  <div key={item._id} className="rounded-lg border p-4" style={{ borderColor: "var(--tan-dark)" }}>
                    <p className="font-serif font-semibold mb-3" style={{ color: "var(--forest)" }}>
                      {item.nombre}
                    </p>
                    <div className="grid gap-3">
                      <TextPair
                        originalLabel="Puesto original"
                        translationLabel="Puesto en ingles"
                        original={item.rol ?? ""}
                        draftKey={`pageMember:${item._id}:rol_en`}
                        drafts={drafts}
                        setDraft={setDraft}
                      />
                      <TextPair
                        originalLabel="Descripcion original"
                        translationLabel="Descripcion en ingles"
                        original={item.descripcion ?? ""}
                        draftKey={`pageMember:${item._id}:descripcion_en`}
                        drafts={drafts}
                        setDraft={setDraft}
                        long
                      />
                    </div>
                    <div className="flex justify-end mt-3">
                      <SaveTranslationButton state={saveState[saveKey]} onClick={() => onSaveMember(item)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleSection>
      )}
    </>
  );
}
