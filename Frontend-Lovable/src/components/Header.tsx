import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Globe, Menu, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Logo } from "./Logo";
import { useLanguage } from "@/lib/language/language-context";

const nav = [
  { to: "/", label: "Inicio" },
  { to: "/menu", label: "Menú" },
  { to: "/eventos", label: "Eventos" },
  { to: "/horarios", label: "Horarios" },
  { to: "/promociones", label: "Promociones" },
  { to: "/conozcanos", label: "Conózcanos" },
  { to: "/preguntas", label: "Preguntas frecuentes" },
  { to: "/resenas", label: "Déjanos tu reseña" },
  { to: "/mis-pedidos", label: "Mis Pedidos" },
] as const;

const navTranslationKeys: Record<(typeof nav)[number]["to"], string> = {
  "/": "nav.home",
  "/menu": "nav.menu",
  "/eventos": "nav.events",
  "/horarios": "nav.hours",
  "/promociones": "nav.promotions",
  "/conozcanos": "nav.about",
  "/preguntas": "nav.faqs",
  "/resenas": "nav.reviews",
  "/mis-pedidos": "nav.myOrders",
};

export function Header() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const languageLabel = language === "es" ? "ES" : "EN";
  const languageTitle = language === "es"
    ? t("header.languageSpanish", "Spanish")
    : t("header.languageEnglish", "English");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const buscar = query.trim();
    navigate({
      to: "/menu",
      search: (buscar ? { buscar } : {}) as never,
    });
    setOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{ background: "var(--tan)", borderColor: "var(--tan-dark)" }}
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-3 flex items-center gap-4">
        <Link to="/" className="shrink-0"><Logo tone="brown" className="h-16" /></Link>

        <nav className="hidden xl:flex items-center gap-4 ml-2 font-serif text-[15px]" style={{ color: "var(--coffee)" }}>
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="whitespace-nowrap hover:text-[var(--forest)] transition-colors"
              activeProps={{ style: { color: "var(--forest)", fontWeight: 600 } }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {t(navTranslationKeys[n.to], n.label)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden md:flex items-center gap-3">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 bg-[var(--cream)] rounded-full px-3 py-1.5 border"
            style={{ borderColor: "var(--tan-dark)" }}
          >
            <button type="submit" aria-label={t("header.searchAria", "Buscar en el menú")} className="shrink-0">
              <Search size={16} style={{ color: "var(--tan-dark)" }} />
            </button>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("header.searchPlaceholder", "Busca algo en el menú...")}
              className="bg-transparent outline-none text-sm w-36 2xl:w-44 font-serif"
            />
          </form>
          <button
            type="button"
            aria-label={t("header.languageAria", "Idioma")}
            title={languageTitle}
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 hover:bg-[var(--cream)]/50"
            style={{ color: "var(--coffee)" }}
          >
            <Globe size={20} />
            <span className="text-xs font-semibold">{languageLabel}</span>
          </button>
        </div>

        <button
          className="xl:hidden ml-auto md:ml-0 p-2 rounded-full transition-colors hover:bg-[var(--cream)]/40"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
          aria-expanded={open}
          style={{ color: "var(--coffee)" }}
        >
          <span className="block transition-transform duration-300 ease-out" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
            {open ? <X /> : <Menu />}
          </span>
        </button>
      </div>

      <div
        aria-hidden={!open}
        className={[
          "xl:hidden overflow-hidden border-t transition-[max-height,opacity,transform,border-color] duration-300 ease-out",
          open ? "max-h-[34rem] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2 pointer-events-none",
        ].join(" ")}
        style={{ borderColor: open ? "var(--tan-dark)" : "transparent", background: "var(--tan)" }}
      >
        <nav className="flex flex-col px-4 py-3 gap-1 font-serif" style={{ color: "var(--coffee)" }}>
          {nav.map((n, index) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className={[
                "py-2 rounded-sm transition-[color,opacity,transform] duration-300 ease-out hover:text-[var(--forest)]",
                open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1",
              ].join(" ")}
              style={{ transitionDelay: open ? `${80 + index * 30}ms` : "0ms" }}
              activeProps={{ style: { color: "var(--forest)", fontWeight: 600 } }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {t(navTranslationKeys[n.to], n.label)}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              toggleLanguage();
              setOpen(false);
            }}
            className="mt-2 inline-flex items-center gap-2 py-2 rounded-sm transition-colors hover:text-[var(--forest)]"
            style={{ color: "var(--coffee)" }}
            aria-label={t("header.languageAria", "Idioma")}
          >
            <Globe size={18} />
            {languageTitle}
          </button>
        </nav>
      </div>
    </header>
  );
}
