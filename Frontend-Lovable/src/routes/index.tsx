import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import { SiteLayout } from "@/components/SiteLayout";
import { api, ApiPagina } from "@/lib/api";
import { fallbackBusinessInfo, getPublicBusinessInfo, type BusinessInfo } from "@/lib/business-info";
import { useLanguage } from "@/lib/language/language-context";
import { usePublicReviews } from "@/lib/reviews";
import { googleReviewSummary, googleReviewUrl, staticGoogleReviews } from "@/lib/static-google-reviews";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Amorena Coffee & Garden - Inicio" },
      { name: "description", content: "Bienvenido a Amorena Coffee & Garden. Tardes y dulces momentos en nuestra cafeteria jardin en El Tejar, Cartago." },
      { property: "og:title", content: "Amorena Coffee & Garden" },
      { property: "og:description", content: "Tardes y dulces momentos." },
    ],
  }),
  component: HomePage,
});

const siteReviews = [
  {
    name: "Andrea S.",
    text: "El mejor cafe que he probado en Cartago. El jardin tiene una magia especial al atardecer.",
    translationKey: "home.site.review.andrea",
    rating: 5,
  },
  {
    name: "Mario L.",
    text: "Llegue de paso y me quede toda la tarde. La tostada de aguacate y un capuchino - perfecto.",
    translationKey: "home.site.review.mario",
    rating: 5,
  },
  {
    name: "Sofia V.",
    text: "Vengo todos los sabados a leer. Es mi rincon favorito de la ciudad.",
    translationKey: "home.site.review.sofia",
    rating: 5,
  },
  {
    name: "Carlos M.",
    text: "El servicio es atento, la presentacion impecable y los precios justos.",
    translationKey: "home.site.review.carlos",
    rating: 5,
  },
];

function HomePage() {
  const [current, setCurrent] = useState(0);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [pagina, setPagina] = useState<ApiPagina | null>(null);
  const { items: publicReviews } = usePublicReviews();
  const { t, text } = useLanguage();

  const heroImages = useMemo(
    () =>
      (pagina?.secciones ?? [])
        .filter((section) => section.slug.startsWith("hero-"))
        .sort((a, b) => a.slug.localeCompare(b.slug))
        .map((section) => ({
          src: section.imagen,
          alt: text(section.titulo || "Amorena Coffee & Garden", section.titulo_en) || "Amorena Coffee & Garden",
        })),
    [pagina, text],
  );

  useEffect(() => {
    if (heroImages.length === 0) return;
    const id = setInterval(() => setCurrent((value) => (value + 1) % heroImages.length), 5000);
    return () => clearInterval(id);
  }, [heroImages.length]);

  useEffect(() => {
    let alive = true;
    getPublicBusinessInfo()
      .then((info) => {
        if (alive) setBusinessInfo(info);
      })
      .catch(() => {
        if (alive) setBusinessInfo(fallbackBusinessInfo);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    api.paginas
      .get("inicio")
      .then((res) => setPagina(res.pagina))
      .catch(() => {});
  }, []);

  const slogan = text(businessInfo?.slogan || "", businessInfo?.slogan_en);
  const siteReviewItems =
    publicReviews.length > 0
      ? publicReviews.slice(0, 4).map((review) => ({
          name: review.name,
          text: text(review.text, review.text_en),
          rating: review.rating,
        }))
      : siteReviews.map((review) => ({
          name: review.name,
          text: t(review.translationKey, review.text),
          rating: review.rating,
        }));

  return (
    <SiteLayout>
      <section className="relative isolate overflow-hidden">
        {heroImages.length === 0 && (
          <div className="absolute inset-0 -z-10" style={{ background: "var(--forest)" }} />
        )}
        {heroImages.map((img, i) => (
          <div
            key={i}
            className="absolute inset-0 -z-10 transition-opacity duration-1000"
            style={{ opacity: i === current ? 1 : 0 }}
          >
            <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(20,15,10,0.35) 0%, rgba(20,15,10,0.65) 100%)" }}
            />
          </div>
        ))}

        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-32 md:py-44 text-center" style={{ color: "var(--cream)" }}>
          <p className="font-serif tracking-[0.4em] uppercase text-xs md:text-sm mb-6 opacity-90">
            {t("home.hero.eyebrow", "Cafeteria - Cartago, Costa Rica")}
          </p>
          <div className="flex justify-center mb-6">
            <Logo tone="tan" className="h-64" />
          </div>
          <p className="font-script text-4xl md:text-5xl mt-6 italic min-h-[1.2em]" style={{ color: "var(--tan)" }}>
            {slogan}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Link to="/horarios" className="btn-primary">{t("home.hero.visit", "Ven a visitarnos!")}</Link>
            <Link to="/menu" className="btn-outline" style={{ color: "var(--cream)", borderColor: "var(--cream)" }}>
              {t("home.hero.menu", "Ver menu")}
            </Link>
          </div>
        </div>

        {heroImages.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((value) => (value - 1 + heroImages.length) % heroImages.length)}
              aria-label={t("home.hero.prev", "Imagen anterior")}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors"
              style={{ background: "rgba(255,255,255,0.15)", color: "var(--cream)" }}
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onClick={() => setCurrent((value) => (value + 1) % heroImages.length)}
              aria-label={t("home.hero.next", "Imagen siguiente")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors"
              style={{ background: "rgba(255,255,255,0.15)", color: "var(--cream)" }}
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}
      </section>

      <section className="py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <p className="font-serif italic" style={{ color: "var(--tan-dark)" }}>
              {t("home.google.eyebrow", "Resenas")}
            </p>
            <h2 className="text-4xl md:text-5xl mt-1" style={{ color: "var(--coffee)" }}>
              {t("home.google.title", "Que dicen nuestros clientes en Google?")}
            </h2>
            {googleReviewSummary.rating && (
              <div className="flex items-center justify-center gap-2 mt-4 font-serif">
                <div className="flex" style={{ color: "var(--forest)" }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} fill={i < Math.round(googleReviewSummary.rating) ? "currentColor" : "transparent"} />
                  ))}
                </div>
                <span className="text-lg" style={{ color: "var(--coffee)" }}>
                  {googleReviewSummary.rating.toFixed(1)}{googleReviewSummary.total ? ` (${googleReviewSummary.total})` : ""}
                </span>
              </div>
            )}
            <a href={googleReviewUrl} target="_blank" rel="noreferrer" className="btn-outline mt-5">
              {t("home.google.cta", "Dejanos tu opinion en Google")}
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {staticGoogleReviews.slice(0, 4).map((review) => (
              <article key={review.id} className="bg-[var(--card)] rounded-lg p-5 border shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: "var(--border)" }}>
                <div className="flex mb-2" style={{ color: "var(--forest)" }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.round(review.rating) ? "currentColor" : "transparent"} />
                  ))}
                </div>
                <p className="font-serif text-[15px] leading-relaxed" style={{ color: "var(--coffee)" }}>
                  "{review.translationKey ? t(review.translationKey, review.text) : review.text}"
                </p>
                {review.url ? (
                  <a href={review.url} target="_blank" rel="noreferrer" className="block font-serif font-semibold mt-4 text-sm hover:underline" style={{ color: "var(--forest)" }}>
                    - {review.name}
                  </a>
                ) : (
                  <p className="font-serif font-semibold mt-4 text-sm" style={{ color: "var(--forest)" }}>- {review.name}</p>
                )}
                {review.relativeTime && (
                  <p className="font-serif text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                    {review.relativeTimeKey ? t(review.relativeTimeKey, review.relativeTime) : review.relativeTime}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4" style={{ background: "color-mix(in oklab, var(--tan) 25%, var(--cream))" }}>
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl" style={{ color: "var(--coffee)" }}>
              {t("home.siteReviews.title", "Que dicen nuestros clientes en nuestro sitio?")}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {siteReviewItems.map((review) => (
              <article key={`${review.name}-${review.text}`} className="bg-[var(--card)] rounded-lg p-6 border shadow-sm" style={{ borderColor: "var(--border)" }}>
                <div className="flex mb-3" style={{ color: "var(--forest)" }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < review.rating ? "currentColor" : "transparent"} />
                  ))}
                </div>
                <p className="font-serif text-[15px] leading-relaxed italic" style={{ color: "var(--coffee)" }}>
                  "{review.text}"
                </p>
                <p className="font-serif font-semibold mt-4 text-sm" style={{ color: "var(--forest)" }}>- {review.name}</p>
              </article>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/resenas" className="btn-primary">{t("home.siteReviews.cta", "Dejanos saber tu opinion")}</Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
