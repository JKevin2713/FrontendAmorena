import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout, PageHeader } from "@/components/SiteLayout";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { SearchBar } from "@/components/ui/search-bar";
import { useFaqs } from "@/lib/faqs";
import { useLanguage } from "@/lib/language/language-context";

export const Route = createFileRoute("/preguntas")({
  head: () => ({
    meta: [
      { title: "Preguntas frecuentes - Amorena" },
      { name: "description", content: "Respuestas a las preguntas más comunes sobre Amorena Coffee & Garden." },
      { property: "og:title", content: "Preguntas frecuentes - Amorena" },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { items, loading, error } = useFaqs();
  const { t, text } = useLanguage();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const translatedItems = items.map((item) => ({
    ...item,
    q: text(item.q, item.qEn),
    a: text(item.a, item.aEn),
  }));
  const filtered = normalizedQuery
    ? translatedItems.filter((item) =>
        item.q.toLowerCase().includes(normalizedQuery) ||
        item.a.toLowerCase().includes(normalizedQuery),
      )
    : translatedItems;

  return (
    <SiteLayout>
      <PageHeader
        title={t("faqs.header.title", "Preguntas Frecuentes")}
        subtitle={t("faqs.header.subtitle", "Todo lo que necesitas saber antes de visitarnos.")}
      />

      <section className="px-4 pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-6">
            <SearchBar
              value={query}
              onChange={setQuery}
              label={t("faqs.search.label", "Buscar preguntas")}
              placeholder={t("faqs.search.placeholder", "Escribe una palabra clave")}
            />
            <div>
              {error && (
                <p className="font-serif mb-3" style={{ color: "var(--destructive)" }}>
                  {error}
                </p>
              )}
              {loading ? (
                <p className="font-serif" style={{ color: "var(--muted-foreground)" }}>
                  {t("faqs.loading", "Cargando preguntas...")}
                </p>
              ) : filtered.length > 0 ? (
                <FaqAccordion items={filtered} className="space-y-4" />
              ) : (
                <p className="font-serif" style={{ color: "var(--muted-foreground)" }}>
                  {t("faqs.empty", "No se encontraron preguntas con ese criterio.")}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
