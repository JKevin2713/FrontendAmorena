import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CoffeeLeafDivider, SiteLayout } from "@/components/SiteLayout";
import { api, type ApiPromocion } from "@/lib/api";
import { useLanguage } from "@/lib/language/language-context";

export const Route = createFileRoute("/promociones")({
  head: () => ({
    meta: [
      { title: "Promociones - Amorena Coffee & Garden" },
      { name: "description", content: "Descubre las promociones, descuentos y beneficios vigentes en Amorena Coffee & Garden." },
      { property: "og:title", content: "Promociones - Amorena" },
    ],
  }),
  component: PromosPage,
});

function PromosPage() {
  const { t, text } = useLanguage();
  const [promos, setPromos] = useState<ApiPromocion[]>([]);
  const [promoSearch, setPromoSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.promociones.getAll()
      .then((res) => setPromos(res.promociones))
      .finally(() => setLoading(false));
  }, []);

  const filteredPromos = useMemo(() => {
    const term = promoSearch.trim().toLowerCase();
    if (!term) return promos;

    return promos.filter((promo) => [
      text(promo.nombre, promo.nombre_en),
      text(promo.descripcion || "", promo.descripcion_en),
      text(promo.descripcion2 || "", promo.descripcion2_en),
      text(promo.ctaLabel || "", promo.ctaLabel_en),
    ].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [promos, promoSearch, text]);

  const scrollToPromo = (id: string) => {
    document.getElementById(`promo-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <SiteLayout>
      <div className="flex min-h-screen" style={{ background: "var(--cream)" }}>
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r py-8 px-4 gap-2 sticky top-0 h-screen" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <div className="relative mb-4">
            <input
              value={promoSearch}
              onChange={(event) => setPromoSearch(event.target.value)}
              placeholder={t("promotions.search.placeholder", "Escribe aquí para buscar...")}
              className="w-full pl-3 pr-3 py-1.5 rounded font-serif text-xs outline-none"
              style={{ background: "var(--cream)", border: "1px solid var(--border)", color: "var(--coffee)" }}
            />
          </div>
          <p className="font-serif text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--coffee)", opacity: .5 }}>
            {t("promotions.sidebar.title", "Promociones vigentes")}
          </p>
          {loading ? (
            <p className="font-serif text-xs" style={{ color: "var(--muted-foreground)" }}>{t("promotions.loading.short", "Cargando...")}</p>
          ) : filteredPromos.length > 0 ? (
            filteredPromos.map((promo) => (
              <button
                key={promo._id}
                onClick={() => scrollToPromo(promo._id)}
                className="text-left font-serif text-sm px-3 py-2 rounded-lg transition-colors truncate hover:bg-[var(--tan)]"
                style={{ color: "var(--coffee)" }}
              >
                {text(promo.nombre, promo.nombre_en)}
              </button>
            ))
          ) : (
            <p className="font-serif text-xs px-3 py-2" style={{ color: "var(--muted-foreground)" }}>{t("promotions.noResults.short", "Sin resultados.")}</p>
          )}
        </aside>

        <main className="flex-1 px-6 py-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10">
              <p className="font-serif text-xs uppercase tracking-widest mb-1" style={{ color: "var(--tan-dark)" }}>{t("promotions.eyebrow", "Promociones vigentes")}</p>
              <h1 className="text-5xl md:text-6xl" style={{ color: "var(--forest)" }}>{t("promotions.title", "Nuestros Beneficios")}</h1>
              <p className="font-serif mt-2" style={{ color: "var(--coffee)" }}>{t("promotions.subtitle", "Disfruta más de Amorena con nuestras promociones especiales y programa de fidelidad.")}</p>
              <CoffeeLeafDivider className="mt-4 justify-start" />
            </div>

            {loading && <p className="font-serif text-center py-20" style={{ color: "var(--coffee)", opacity: .5 }}>{t("promotions.loading", "Cargando promociones...")}</p>}

            {!loading && promos.length === 0 && (
              <p className="font-serif text-center py-20" style={{ color: "var(--coffee)", opacity: .4 }}>{t("promotions.empty", "No hay promociones vigentes.")}</p>
            )}

            {!loading && promos.length > 0 && filteredPromos.length === 0 && (
              <p className="font-serif text-center py-20" style={{ color: "var(--coffee)", opacity: .4 }}>{t("promotions.noResults", "No encontramos promociones con esa búsqueda.")}</p>
            )}

            <div className="space-y-16 max-w-4xl mx-auto">
              {filteredPromos.map((promo) => {
                const title = text(promo.nombre, promo.nombre_en);
                const primaryDescription = text(promo.descripcion || "", promo.descripcion_en);
                const secondaryDescription = text(promo.descripcion2 || "", promo.descripcion2_en);
                const ctaLabel = text(promo.ctaLabel || t("promotions.ctaFallback", "Ver más"), promo.ctaLabel_en);

                return (
                  <article id={`promo-${promo._id}`} key={promo._id} className="scroll-mt-28">
                    <hr className="mb-10" style={{ borderColor: "var(--border)" }} />
                    <div className={`flex flex-col ${promo.imgDerecha ? "md:flex-row" : "md:flex-row-reverse"} gap-8 items-start`}>
                      <div className="flex-1">
                        <h2 className="font-script text-3xl md:text-4xl mb-5" style={{ color: "var(--coffee)" }}>{title}</h2>
                        <div className="rounded-xl p-6 space-y-4" style={{ background: "color-mix(in oklab, var(--tan) 35%, var(--cream))", border: "1px solid var(--tan-dark)" }}>
                          {promo.descripcion && <p className="font-serif text-sm leading-relaxed" style={{ color: "var(--coffee)" }}>{primaryDescription}</p>}
                          {promo.descripcion2 && <p className="font-serif text-sm leading-relaxed" style={{ color: "var(--coffee)" }}>{secondaryDescription}</p>}
                        </div>
                        {promo.tieneCta && promo.link && (
                          <a href={promo.link} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2 mt-5 text-sm">
                            <Download size={14} />
                            {ctaLabel}
                          </a>
                        )}
                      </div>
                      <div className="w-full md:w-72 shrink-0 rounded-xl overflow-hidden shadow-md">
                        <img src={promo.imagen || promoFallback} alt={title} className="w-full h-64 object-cover" />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </SiteLayout>
  );
}
