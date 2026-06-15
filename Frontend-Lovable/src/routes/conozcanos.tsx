import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout, PageHeader } from "@/components/SiteLayout";
import { api, ApiMiembro, ApiPagina, ApiSeccion } from "@/lib/api";
import { useLanguage } from "@/lib/language/language-context";

export const Route = createFileRoute("/conozcanos")({
  head: () => ({
    meta: [
      { title: "Conozcanos - Amorena Coffee & Garden" },
      { name: "description", content: "La historia y el alma de Amorena Coffee & Garden: una cafeteria jardin nacida del amor por los pequenos momentos." },
      { property: "og:title", content: "Conozcanos - Amorena" },
    ],
  }),
  component: AboutPage,
});

type DefaultSection = {
  titulo: string;
  texto: string;
  imagen: string;
  tituloKey: string;
  textoKey: string;
};

type AboutSection = ApiSeccion & {
  tituloKey: string;
  textoKey: string;
};

const DEFAULT_SECCIONES: Record<string, DefaultSection> = {
  "que-es": {
    titulo: "Que es Amorena?",
    texto: "Amorena Coffee & Garden es un rincon verde en el centro de El Tejar donde el cafe se sirve lento, las plantas abrazan las mesas y las tardes se quedan a vivir. Trabajamos con productores locales, recetas hechas en casa y un jardin que cambia con la luz del dia.",
    imagen: "",
    tituloKey: "about.default.what.title",
    textoKey: "about.default.what.text",
  },
  "quienes-somos": {
    titulo: "Quienes somos?",
    texto: "Somos una familia apasionada por el cafe y la hospitalidad. Nuestro equipo lo conforman baristas, cocineros y sonadores que creen que un buen lugar puede transformar el dia de alguien. Cada plato y cada taza pasa por manos que se preocupan por los detalles.",
    imagen: "",
    tituloKey: "about.default.who.title",
    textoKey: "about.default.who.text",
  },
  "nuestra-historia": {
    titulo: "Nuestra historia",
    texto: "Amorena nacio en 2021 como un pequeno puesto de cafe en el patio de la casa de la abuela. Lo que empezo como un encuentro de amigos se transformo en un espacio para toda la comunidad. Hoy seguimos creciendo, pero con la misma promesa de siempre: tardes y dulces momentos para quien nos visita.",
    imagen: "",
    tituloKey: "about.default.history.title",
    textoKey: "about.default.history.text",
  },
};

function getSeccion(pagina: ApiPagina | null, slug: string): AboutSection {
  const fromApi = pagina?.secciones.find((s) => s.slug === slug);
  const def = DEFAULT_SECCIONES[slug];
  return {
    slug,
    titulo: fromApi?.titulo || def.titulo,
    titulo_en: fromApi?.titulo_en,
    texto: fromApi?.texto || def.texto,
    texto_en: fromApi?.texto_en,
    imagen: fromApi?.imagen || def.imagen,
    tituloKey: def.tituloKey,
    textoKey: def.textoKey,
  };
}

function Divider() {
  return (
    <div className="flex items-center justify-center gap-3 py-2" style={{ color: "var(--coffee)", opacity: 0.3 }}>
      <span className="block h-px w-16" style={{ background: "var(--coffee)" }} />
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.5 0 3-.3 4.3-.9" />
        <path d="M12 2c2 3 3.5 7 3.5 10s-1.5 7-3.5 10" />
        <path d="M17 8c2.2 1 4 3 5 5.5" />
        <path d="M22 12c0-1.5-.3-3-.8-4.3" />
      </svg>
      <span className="block h-px w-16" style={{ background: "var(--coffee)" }} />
    </div>
  );
}

function AboutPage() {
  const [pagina, setPagina] = useState<ApiPagina | null>(null);
  const { t, text } = useLanguage();

  useEffect(() => {
    api.paginas
      .get("conozcanos")
      .then((res) => setPagina(res.pagina))
      .catch(() => {});
  }, []);

  const queEs = getSeccion(pagina, "que-es");
  const quienesSomos = getSeccion(pagina, "quienes-somos");
  const historia = getSeccion(pagina, "nuestra-historia");
  const miembros: ApiMiembro[] = pagina?.miembros ?? [];

  const rows: ApiMiembro[][] = [];
  for (let i = 0; i < miembros.length; i += 3) rows.push(miembros.slice(i, i + 3));

  const sectionTitle = (section: AboutSection) =>
    section.titulo_en ? text(section.titulo, section.titulo_en) : t(section.tituloKey, section.titulo);
  const sectionText = (section: AboutSection) =>
    section.texto_en ? text(section.texto, section.texto_en) : t(section.textoKey, section.texto);

  return (
    <SiteLayout>
      <PageHeader
        title={t("about.header.title", "Conozcanos")}
        subtitle={t("about.header.subtitle", "Una cafeteria nacida del amor por los pequenos momentos.")}
      />

      <section className="px-4 pb-20">
        <div className="mx-auto max-w-5xl">
          <div className="relative mb-8">
            {queEs.imagen && (
              <img
                src={queEs.imagen}
                alt={t("about.imageAlt.exterior", "Exterior del cafe al atardecer")}
                loading="lazy"
                className="rounded-3xl shadow-lg w-full h-[480px] object-cover"
                style={{ border: "3px solid var(--cream)" }}
              />
            )}
            <div
              className="md:absolute md:bottom-8 md:left-8 md:max-w-md rounded-2xl p-8 shadow-xl mt-[-3rem] mx-4 md:mx-0 md:mt-0 relative z-10"
              style={{ background: "var(--cream)", border: "2px solid var(--coffee)", opacity: 0.95 }}
            >
              <h2 className="text-4xl md:text-5xl mb-4" style={{ color: "var(--coffee)" }}>{sectionTitle(queEs)}</h2>
              <p className="font-serif text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                {sectionText(queEs)}
              </p>
            </div>
          </div>

          <Divider />

          <div className="my-8">
            <div
              className="rounded-3xl p-8 md:p-12 flex flex-col-reverse md:flex-row gap-8 md:gap-12 items-center"
              style={{ background: "var(--forest)", color: "var(--cream)" }}
            >
              {quienesSomos.imagen && (
                <div className="md:w-[50%] flex-shrink-0">
                  <img
                    src={quienesSomos.imagen}
                    alt={t("about.imageAlt.interior", "Interior elegante del cafe")}
                    loading="lazy"
                    className="rounded-2xl shadow-2xl w-full h-[420px] object-cover md:-ml-8 md:-mb-16"
                    style={{ border: "3px solid var(--cream)" }}
                  />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-4xl md:text-5xl mb-5" style={{ color: "var(--cream)" }}>{sectionTitle(quienesSomos)}</h2>
                <p className="font-serif text-lg leading-relaxed opacity-95">{sectionText(quienesSomos)}</p>
              </div>
            </div>
          </div>

          <Divider />

          <div className="flex flex-col-reverse md:flex-row gap-8 md:gap-14 items-center mt-8">
            {historia.imagen && (
              <div className="md:w-[50%] flex-shrink-0">
                <img
                  src={historia.imagen}
                  alt={t("about.imageAlt.plate", "Plato servido en Amorena")}
                  loading="lazy"
                  className="rounded-2xl shadow-md w-full h-[420px] object-cover"
                  style={{ border: "3px solid var(--cream)" }}
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-4xl md:text-5xl mb-5" style={{ color: "var(--coffee)" }}>{sectionTitle(historia)}</h2>
              <p className="font-serif text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                {sectionText(historia)}
              </p>
            </div>
          </div>

          {miembros.length > 0 && (
            <>
              <Divider />

              <div className="mt-8 text-center">
                <h2 className="text-4xl md:text-5xl mb-3" style={{ color: "var(--coffee)" }}>
                  {t("about.family.title", "Nuestra familia")}
                </h2>
                <p className="font-serif text-lg mb-12" style={{ color: "var(--muted-foreground)" }}>
                  {t("about.family.subtitle", "Las personas que hacen de Amorena un lugar especial.")}
                </p>

                {rows.map((row, ri) => (
                  <div key={ri} className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10 justify-items-center">
                    {row.map((m) => (
                      <div key={m._id ?? m.nombre} className="flex flex-col items-center">
                        {m.imagen ? (
                          <img src={m.imagen} alt={m.nombre} className="w-36 h-36 rounded-full object-cover shadow-md mb-4" style={{ border: "3px solid var(--cream)" }} />
                        ) : (
                          <div
                            className="w-36 h-36 rounded-full flex items-center justify-center text-4xl font-serif shadow-md mb-4"
                            style={{ background: "var(--forest)", color: "var(--cream)", border: "3px solid var(--cream)" }}
                          >
                            {m.iniciales}
                          </div>
                        )}
                        <h3 className="text-xl font-semibold mb-1" style={{ color: "var(--coffee)" }}>{m.nombre}</h3>
                        <span className="text-sm font-serif tracking-wide uppercase mb-3" style={{ color: "var(--forest)", opacity: 0.8 }}>
                          {text(m.rol, m.rol_en)}
                        </span>
                        <p className="font-serif text-base leading-relaxed max-w-xs" style={{ color: "var(--muted-foreground)" }}>
                          {text(m.descripcion, m.descripcion_en)}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
