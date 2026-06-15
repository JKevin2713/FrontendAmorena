import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminTitle } from "@/components/admin/AdminLayout";
import { Card } from "@/components/admin/ui";
import { BusinessInfoTranslations } from "@/components/admin/language/BusinessInfoTranslations";
import { EventTranslations } from "@/components/admin/language/EventTranslations";
import { ExceptionTranslations } from "@/components/admin/language/ExceptionTranslations";
import { FaqTranslations } from "@/components/admin/language/FaqTranslations";
import { LanguageSectionFilters } from "@/components/admin/language/LanguageSectionFilters";
import { MenuTranslations } from "@/components/admin/language/MenuTranslations";
import { PageTranslations } from "@/components/admin/language/PageTranslations";
import { PromotionTranslations } from "@/components/admin/language/PromotionTranslations";
import { RegularScheduleTranslations } from "@/components/admin/language/RegularScheduleTranslations";
import { ReviewTranslations } from "@/components/admin/language/ReviewTranslations";
import { StaticTranslations } from "@/components/admin/language/StaticTranslations";
import { TranslationJsonTools } from "@/components/admin/language/TranslationJsonTools";
import type { Drafts, SaveState } from "@/components/admin/language/types";
import {
  fetchLanguageSection,
  updateFaqTranslation,
  updateBusinessInfoTranslation,
  updateEventTranslation,
  updateMenuCategoryTranslation,
  updateMenuFilterTranslation,
  updateMenuProductTranslation,
  updatePageMemberTranslation,
  updatePageSectionTranslation,
  updatePromotionTranslation,
  updateRegularScheduleTranslation,
  updateReviewTranslation,
  updateScheduleExceptionTranslation,
  updateStaticTranslation,
  type LanguageBusinessInfo,
  type LanguageEvent,
  type LanguageFaq,
  type LanguageMenuCategory,
  type LanguageMenuFilter,
  type LanguageMenuProduct,
  type LanguagePageMember,
  type LanguagePageSection,
  type LanguagePromotion,
  type LanguageRegularSchedule,
  type LanguageReview,
  type LanguageScheduleException,
  type LanguageSection,
  type LanguageSectionData,
  type StaticTranslationItem,
} from "@/lib/language/admin";

export const Route = createFileRoute("/admin/lenguajes")({ component: Page });

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function buildDrafts(data: LanguageSectionData): Drafts {
  const drafts: Drafts = {};
  data.staticText.forEach((item) => {
    drafts[`static:${item.key}`] = item.en ?? "";
  });
  data.faqs?.forEach((item) => {
    drafts[`faq:${item._id}:pregunta_en`] = item.pregunta_en ?? "";
    drafts[`faq:${item._id}:respuesta_en`] = item.respuesta_en ?? "";
  });
  data.regularSchedule?.forEach((item) => {
    drafts[`regular:${item._id}:dia_en`] = item.dia_en ?? "";
  });
  data.exceptions?.forEach((item) => {
    drafts[`exception:${item._id}:motivo_en`] = item.motivo_en ?? "";
  });
  data.promociones?.forEach((item) => {
    drafts[`promotion:${item._id}:nombre_en`] = item.nombre_en ?? "";
    drafts[`promotion:${item._id}:descripcion_en`] = item.descripcion_en ?? "";
    drafts[`promotion:${item._id}:descripcion2_en`] = item.descripcion2_en ?? "";
    drafts[`promotion:${item._id}:ctaLabel_en`] = item.ctaLabel_en ?? "";
  });
  data.eventos?.forEach((item) => {
    drafts[`event:${item._id}:nombre_en`] = item.nombre_en ?? "";
    drafts[`event:${item._id}:categoria_en`] = item.categoria_en ?? "";
    drafts[`event:${item._id}:descripcion_en`] = item.descripcion_en ?? "";
  });
  data.resenas?.forEach((item) => {
    const id = String(item._id || item.id || "");
    drafts[`review:${id}:comentario_en`] = item.comentario_en ?? item.text_en ?? "";
  });
  if (data.businessInfo) {
    drafts["business:descripcion_en"] = data.businessInfo.descripcion_en ?? "";
    drafts["business:slogan_en"] = data.businessInfo.slogan_en ?? "";
    drafts["business:direccion_en"] = data.businessInfo.direccion_en ?? "";
  }
  data.products?.forEach((item) => {
    drafts[`menuProduct:${item._id}:nombre_en`] = item.nombre_en ?? "";
    drafts[`menuProduct:${item._id}:descripcion_en`] = item.descripcion_en ?? "";
  });
  data.menuCategories?.forEach((item) => {
    drafts[`menuCategory:${item._id}:nombre_en`] = item.nombre_en ?? "";
    drafts[`menuCategory:${item._id}:descripcion_en`] = item.descripcion_en ?? "";
  });
  data.filters?.forEach((item) => {
    drafts[`menuFilter:${item._id}:nombre_en`] = item.nombre_en ?? "";
    drafts[`menuFilter:${item._id}:descripcion_en`] = item.descripcion_en ?? "";
  });
  data.pageSections?.forEach((item) => {
    drafts[`pageSection:${item.slug}:titulo_en`] = item.titulo_en ?? "";
    drafts[`pageSection:${item.slug}:texto_en`] = item.texto_en ?? "";
  });
  data.pageMembers?.forEach((item) => {
    drafts[`pageMember:${item._id}:rol_en`] = item.rol_en ?? "";
    drafts[`pageMember:${item._id}:descripcion_en`] = item.descripcion_en ?? "";
  });
  return drafts;
}

function Page() {
  const [section, setSection] = useState<LanguageSection>("faqs");
  const [month, setMonth] = useState(currentMonthValue);
  const [data, setData] = useState<LanguageSectionData | null>(null);
  const [drafts, setDrafts] = useState<Drafts>({});
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>({});
  const [error, setError] = useState<string | null>(null);

  const loadSection = async (active = true) => {
    setLoading(true);
    try {
      const next = await fetchLanguageSection(section, section === "horarios" ? { month } : {});
      if (!active) return;
      setData(next);
      setDrafts(buildDrafts(next));
      setError(null);
    } catch (err) {
      if (!active) return;
      setError(err instanceof Error ? err.message : "No se pudieron cargar las traducciones.");
    } finally {
      if (active) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    loadSection(active);
    return () => {
      active = false;
    };
  }, [month, section]);

  const setDraft = (key: string, value: string) => {
    setDrafts((current) => ({ ...current, [key]: value }));
  };

  const runSave = async (key: string, action: () => Promise<unknown>) => {
    setSaveState((current) => ({ ...current, [key]: "saving" }));
    try {
      await action();
      setError(null);
      setSaveState((current) => ({ ...current, [key]: "success" }));
      window.setTimeout(() => {
        setSaveState((current) => {
          if (current[key] !== "success") return current;
          const next = { ...current };
          delete next[key];
          return next;
        });
      }, 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la traduccion.");
      setSaveState((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  const saveStatic = async (item: StaticTranslationItem) => {
    const key = `static:${item.key}`;
    await runSave(key, () => updateStaticTranslation(section, item.key, drafts[key] ?? ""));
  };

  const saveFaq = async (item: LanguageFaq) => {
    const key = `faq:${item._id}`;
    await runSave(key, () =>
      updateFaqTranslation(item._id, {
        pregunta_en: drafts[`faq:${item._id}:pregunta_en`] ?? "",
        respuesta_en: drafts[`faq:${item._id}:respuesta_en`] ?? "",
      }),
    );
  };

  const saveRegularSchedule = async (item: LanguageRegularSchedule) => {
    const key = `regular:${item._id}`;
    await runSave(key, () =>
      updateRegularScheduleTranslation(item._id, {
        dia_en: drafts[`regular:${item._id}:dia_en`] ?? "",
      }),
    );
  };

  const saveException = async (item: LanguageScheduleException) => {
    const key = `exception:${item._id}`;
    await runSave(key, () =>
      updateScheduleExceptionTranslation(item._id, {
        motivo_en: drafts[`exception:${item._id}:motivo_en`] ?? "",
      }),
    );
  };

  const savePromotion = async (item: LanguagePromotion) => {
    const key = `promotion:${item._id}`;
    await runSave(key, () =>
      updatePromotionTranslation(item._id, {
        nombre_en: drafts[`promotion:${item._id}:nombre_en`] ?? "",
        descripcion_en: drafts[`promotion:${item._id}:descripcion_en`] ?? "",
        descripcion2_en: drafts[`promotion:${item._id}:descripcion2_en`] ?? "",
        ctaLabel_en: drafts[`promotion:${item._id}:ctaLabel_en`] ?? "",
      }),
    );
  };

  const saveEvent = async (item: LanguageEvent) => {
    const key = `event:${item._id}`;
    await runSave(key, () =>
      updateEventTranslation(item._id, {
        nombre_en: drafts[`event:${item._id}:nombre_en`] ?? "",
        categoria_en: drafts[`event:${item._id}:categoria_en`] ?? "",
        descripcion_en: drafts[`event:${item._id}:descripcion_en`] ?? "",
      }),
    );
  };

  const saveReview = async (item: LanguageReview) => {
    const id = String(item._id || item.id || "");
    const key = `review:${id}`;
    await runSave(key, () =>
      updateReviewTranslation(id, {
        comentario_en: drafts[`review:${id}:comentario_en`] ?? "",
      }),
    );
  };

  const saveBusinessInfo = async (_item: LanguageBusinessInfo) => {
    if (section !== "home" && section !== "footer") return;
    await runSave("businessInfo", () =>
      updateBusinessInfoTranslation(
        section,
        section === "home"
          ? {
              descripcion_en: drafts["business:descripcion_en"] ?? "",
              slogan_en: drafts["business:slogan_en"] ?? "",
            }
          : {
              direccion_en: drafts["business:direccion_en"] ?? "",
            },
      ),
    );
  };

  const saveMenuProduct = async (item: LanguageMenuProduct) => {
    const key = `menuProduct:${item._id}`;
    await runSave(key, () =>
      updateMenuProductTranslation(item._id, {
        nombre_en: drafts[`menuProduct:${item._id}:nombre_en`] ?? "",
        descripcion_en: drafts[`menuProduct:${item._id}:descripcion_en`] ?? "",
      }),
    );
  };

  const saveMenuCategory = async (item: LanguageMenuCategory) => {
    const key = `menuCategory:${item._id}`;
    await runSave(key, () =>
      updateMenuCategoryTranslation(item._id, {
        nombre_en: drafts[`menuCategory:${item._id}:nombre_en`] ?? "",
        descripcion_en: drafts[`menuCategory:${item._id}:descripcion_en`] ?? "",
      }),
    );
  };

  const saveMenuFilter = async (item: LanguageMenuFilter) => {
    const key = `menuFilter:${item._id}`;
    await runSave(key, () =>
      updateMenuFilterTranslation(item._id, {
        nombre_en: drafts[`menuFilter:${item._id}:nombre_en`] ?? "",
        descripcion_en: drafts[`menuFilter:${item._id}:descripcion_en`] ?? "",
      }),
    );
  };

  const savePageSection = async (item: LanguagePageSection) => {
    if (section !== "home" && section !== "conozcanos") return;
    const key = `pageSection:${item.slug}`;
    await runSave(key, () =>
      updatePageSectionTranslation(section, item.slug, {
        titulo_en: drafts[`pageSection:${item.slug}:titulo_en`] ?? "",
        texto_en: drafts[`pageSection:${item.slug}:texto_en`] ?? "",
      }),
    );
  };

  const savePageMember = async (item: LanguagePageMember) => {
    if (section !== "conozcanos") return;
    const key = `pageMember:${item._id}`;
    await runSave(key, () =>
      updatePageMemberTranslation(section, item._id, {
        rol_en: drafts[`pageMember:${item._id}:rol_en`] ?? "",
        descripcion_en: drafts[`pageMember:${item._id}:descripcion_en`] ?? "",
      }),
    );
  };

  return (
    <div>
      <AdminTitle
        title="Gestionar lenguajes"
        subtitle="Edita las traducciones al inglés por sección sin cambiar los editores principales."
      />

      <Card className="mb-6">
        <LanguageSectionFilters
          section={section}
          month={month}
          onSectionChange={setSection}
          onMonthChange={setMonth}
        />
        <div className="mt-2">
          <TranslationJsonTools
            section={section}
            month={month}
            onImported={() => loadSection()}
            onError={setError}
          />
        </div>
      </Card>

      {error && (
        <p className="mb-4 text-sm font-serif" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}

      {loading || !data ? (
        <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
          Cargando traducciones...
        </p>
      ) : (
        <div className="grid gap-6">
          <StaticTranslations items={data.staticText} drafts={drafts} setDraft={setDraft} saveState={saveState} onSave={saveStatic} />

          {section === "faqs" && (
            <FaqTranslations items={data.faqs ?? []} drafts={drafts} setDraft={setDraft} saveState={saveState} onSave={saveFaq} />
          )}

          {section === "horarios" && (
            <>
              <RegularScheduleTranslations
                items={data.regularSchedule ?? []}
                drafts={drafts}
                setDraft={setDraft}
                saveState={saveState}
                onSave={saveRegularSchedule}
              />
              <ExceptionTranslations
                items={data.exceptions ?? []}
                drafts={drafts}
                setDraft={setDraft}
                saveState={saveState}
                onSave={saveException}
              />
            </>
          )}

          {section === "menu" && (
            <MenuTranslations
              products={data.products ?? []}
              categories={data.menuCategories ?? []}
              filters={data.filters ?? []}
              drafts={drafts}
              setDraft={setDraft}
              saveState={saveState}
              onSaveProduct={saveMenuProduct}
              onSaveCategory={saveMenuCategory}
              onSaveFilter={saveMenuFilter}
            />
          )}

          {section === "promociones" && (
            <PromotionTranslations items={data.promociones ?? []} drafts={drafts} setDraft={setDraft} saveState={saveState} onSave={savePromotion} />
          )}

          {section === "eventos" && (
            <EventTranslations items={data.eventos ?? []} drafts={drafts} setDraft={setDraft} saveState={saveState} onSave={saveEvent} />
          )}

          {section === "resenas" && (
            <ReviewTranslations items={data.resenas ?? []} drafts={drafts} setDraft={setDraft} saveState={saveState} onSave={saveReview} />
          )}

          {section === "home" && (
            <PageTranslations
              sectionTitle="Fotos y mensajes del inicio"
              sectionSubtitle="Textos que acompanan las imagenes principales de la portada."
              pageSections={data.pageSections ?? []}
              drafts={drafts}
              setDraft={setDraft}
              saveState={saveState}
              onSaveSection={savePageSection}
            />
          )}

          {section === "conozcanos" && (
            <PageTranslations
              sectionTitle="Secciones de Conozcanos"
              sectionSubtitle="Titulos y parrafos que cuentan la historia, identidad y proposito de Amorena."
              pageSections={data.pageSections ?? []}
              pageMembers={data.pageMembers ?? []}
              drafts={drafts}
              setDraft={setDraft}
              saveState={saveState}
              onSaveSection={savePageSection}
              onSaveMember={savePageMember}
            />
          )}

          {(section === "home" || section === "footer") && (
            <BusinessInfoTranslations
              section={section}
              item={data.businessInfo}
              drafts={drafts}
              setDraft={setDraft}
              saveState={saveState}
              onSave={saveBusinessInfo}
            />
          )}
        </div>
      )}
    </div>
  );
}
