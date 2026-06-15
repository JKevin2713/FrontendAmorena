import { createFileRoute } from "@tanstack/react-router";
import { Calendar, MapPin } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { EventPdfControls } from "@/components/events/EventPdfControls";
import { CoffeeLeafDivider, SiteLayout } from "@/components/SiteLayout";
import { api, type ApiEvento } from "@/lib/api";
import { useLanguage } from "@/lib/language/language-context";

export const Route = createFileRoute("/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos - Amorena Coffee & Garden" },
      { name: "description", content: "Conciertos acústicos, catas de café, talleres y noches temáticas en Amorena Coffee & Garden." },
      { property: "og:title", content: "Eventos - Amorena" },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { t, text } = useLanguage();
  const [email, setEmail] = useState("");
  const [eventos, setEventos] = useState<ApiEvento[]>([]);
  const [eventSearch, setEventSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    api.eventos.getAll()
      .then((res) => setEventos(res.eventos))
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (value?: string) => {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    const monthIndex = Number(month);
    const monthName = t(`events.month.${monthIndex}`, ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][monthIndex - 1] || "");
    return `${Number(day)} ${monthName}, ${year}`;
  };

  const filteredEventos = useMemo(() => {
    const term = eventSearch.trim().toLowerCase();
    if (!term) return eventos;

    return eventos.filter((evento) => [
      text(evento.nombre, evento.nombre_en),
      text(evento.descripcion || "", evento.descripcion_en),
      text(evento.categoria || "", evento.categoria_en),
      evento.fecha,
      evento.hora,
    ].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [eventos, eventSearch, text]);

  const featured = filteredEventos.find((event) => event.destacado);
  const upcoming = filteredEventos.filter((event) => event._id !== featured?._id);

  const scrollToEvent = (id: string) => {
    document.getElementById(`event-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleNewsletterSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setNewsletterLoading(true);
    setNewsletterStatus("idle");
    setNewsletterMessage("");

    try {
      const response = await api.newsletter.subscribe(trimmedEmail);
      setNewsletterStatus("success");
      setNewsletterMessage(response.message);
      setEmail("");
    } catch (error) {
      setNewsletterStatus("error");
      setNewsletterMessage(error instanceof Error ? error.message : t("events.newsletter.error", "No pudimos completar la suscripción."));
    } finally {
      setNewsletterLoading(false);
    }
  };

  const renderEventCard = (event: ApiEvento, compact = false) => {
    const title = text(event.nombre, event.nombre_en);
    const description = text(event.descripcion || "", event.descripcion_en);
    const location = t("events.location.default", "Jardín principal");
    return (
      <article id={`event-${event._id}`} key={event._id} className={compact ? "flex gap-5 rounded-xl overflow-hidden border shadow-sm scroll-mt-28" : "grid md:grid-cols-2 gap-0 rounded-xl overflow-hidden border shadow-sm"} style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className={compact ? "w-36 shrink-0 overflow-hidden" : "aspect-[4/3] md:aspect-auto overflow-hidden"}>
          <img src={event.imagen || musicImg} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className={compact ? "py-5 pr-6 flex flex-col justify-center" : "p-8 flex flex-col justify-center"} style={compact ? undefined : { background: "color-mix(in oklab, var(--tan) 30%, var(--card))" }}>
          <div className={`flex items-center gap-2 font-serif ${compact ? "text-xs mb-1" : "text-sm mb-2"}`} style={{ color: "var(--forest)" }}>
            <Calendar size={compact ? 13 : 15} />
            <span className="uppercase tracking-widest">{fmtDate(event.fecha)}</span>
          </div>
          <h3 className={compact ? "text-2xl" : "text-3xl md:text-4xl"} style={{ color: "var(--coffee)" }}>{title}</h3>
          <p className={`font-serif ${compact ? "mt-1" : "mt-4"} leading-relaxed text-sm`} style={{ color: "var(--muted-foreground)" }}>{description}</p>
          <div className={`flex items-center gap-2 ${compact ? "mt-2 text-xs" : "mt-4 text-sm"} font-serif`} style={{ color: "var(--coffee)" }}>
            <MapPin size={compact ? 13 : 15} /> {location}{event.hora && ` - ${event.hora}`}
          </div>
          <button className={`btn-primary ${compact ? "mt-3 text-sm" : "mt-6"} self-start`}>{t("events.reserve", "Reservar lugar")}</button>
        </div>
      </article>
    );
  };

  return (
    <SiteLayout>
      <div className="flex min-h-screen" style={{ background: "var(--cream)" }}>
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r py-8 px-4 gap-2 sticky top-0 h-screen" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <div className="relative mb-4">
            <input
              value={eventSearch}
              onChange={(event) => setEventSearch(event.target.value)}
              placeholder={t("events.search.placeholder", "Escribe aquí para buscar...")}
              className="w-full pl-3 pr-3 py-1.5 rounded font-serif text-xs outline-none"
              style={{ background: "var(--cream)", border: "1px solid var(--border)", color: "var(--coffee)" }}
            />
          </div>
          <p className="font-serif text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--coffee)", opacity: .5 }}>{t("events.sidebar.title", "Eventos")}</p>
          {loading ? (
            <p className="font-serif text-xs" style={{ color: "var(--muted-foreground)" }}>{t("events.loading.short", "Cargando...")}</p>
          ) : filteredEventos.length > 0 ? (
            filteredEventos.map((event) => (
              <button key={event._id} onClick={() => scrollToEvent(event._id)} className="text-left font-serif text-sm px-3 py-2 rounded-lg truncate transition-colors hover:bg-[var(--tan)]" style={{ color: "var(--coffee)" }}>
                {text(event.nombre, event.nombre_en)}
              </button>
            ))
          ) : (
            <p className="font-serif text-xs px-3 py-2" style={{ color: "var(--muted-foreground)" }}>{t("events.noResults.short", "Sin resultados.")}</p>
          )}
        </aside>

        <main className="flex-1 px-6 py-10">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-start justify-between gap-4 mb-8">
              <div>
                <p className="font-serif text-xs uppercase tracking-widest mb-1" style={{ color: "var(--tan-dark)" }}>{t("events.eyebrow", "Menú de eventos")}</p>
                <h1 className="text-5xl md:text-6xl" style={{ color: "var(--forest)" }}>{t("events.title", "Ven a nuestros eventos")}</h1>
                <p className="font-serif mt-2" style={{ color: "var(--coffee)" }}>{t("events.subtitle", "Busca y lee acerca de nuestros próximos eventos.")}</p>
                <CoffeeLeafDivider className="mt-4 justify-start" />
              </div>
              <div className="hidden lg:flex flex-col items-center gap-3 rounded-xl p-5 shrink-0 w-52 text-center" style={{ background: "var(--tan)", border: "1px solid var(--tan-dark)" }}>
                <p className="font-serif text-sm font-semibold" style={{ color: "var(--coffee)" }}>{t("events.download.question", "¿Quieres guardar o compartir la información de un evento?")}</p>
                <p className="font-serif text-xs" style={{ color: "var(--coffee)", opacity: .8 }}>{t("events.download.hint", "¡Descárgalo aquí!")}</p>
                <EventPdfControls events={eventos} disabled={loading} />
              </div>
            </div>

            <div className="lg:hidden rounded-xl p-4 mb-8" style={{ background: "var(--tan)", border: "1px solid var(--tan-dark)" }}>
              <p className="font-serif text-sm font-semibold mb-3" style={{ color: "var(--coffee)" }}>{t("events.download.question", "¿Quieres guardar o compartir la información de un evento?")}</p>
              <EventPdfControls events={eventos} disabled={loading} />
            </div>

            {loading && <p className="font-serif text-center py-20" style={{ color: "var(--coffee)", opacity: .5 }}>{t("events.loading", "Cargando eventos...")}</p>}

            {!loading && featured && (
              <section id={`event-${featured._id}`} className="mb-12 scroll-mt-28">
                <h2 className="font-script text-4xl mb-5" style={{ color: "var(--coffee)" }}>{t("events.featured", "Destacado")}</h2>
                {renderEventCard(featured)}
              </section>
            )}

            {!loading && upcoming.length > 0 && (
              <section className="mb-12">
                <h2 className="font-script text-4xl mb-5" style={{ color: "var(--coffee)" }}>{t("events.upcoming", "Próximos eventos")}</h2>
                <div className="space-y-5">
                  {upcoming.map((event) => renderEventCard(event, true))}
                </div>
              </section>
            )}

            {!loading && eventos.length === 0 && (
              <p className="font-serif text-center py-20" style={{ color: "var(--coffee)", opacity: .4 }}>{t("events.empty", "No hay eventos próximos.")}</p>
            )}

            {!loading && eventos.length > 0 && filteredEventos.length === 0 && (
              <p className="font-serif text-center py-20" style={{ color: "var(--coffee)", opacity: .4 }}>{t("events.noResults", "No encontramos eventos con esa búsqueda.")}</p>
            )}
          </div>
        </main>
      </div>

      <section className="py-16 px-4" style={{ background: "var(--forest)", color: "var(--cream)" }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl" style={{ color: "var(--cream)" }}>{t("events.newsletter.title", "Suscríbete a noticias y eventos")}</h2>
          <p className="font-serif mt-3 opacity-90">{t("events.newsletter.subtitle", "Recibe nuestras nuevas fechas, promociones y novedades del menú directo en tu correo.")}</p>
          <form onSubmit={handleNewsletterSubmit} className="mt-7 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("events.newsletter.placeholder", "tu@correo.com")}
              className="flex-1 px-4 py-3 rounded-md font-serif outline-none"
              style={{ background: "var(--cream)", color: "var(--coffee)" }}
            />
            <button type="submit" disabled={newsletterLoading} className="btn-primary disabled:opacity-70" style={{ background: "var(--tan)", color: "var(--coffee)" }}>
              {newsletterLoading ? t("events.newsletter.loading", "Enviando...") : t("events.newsletter.button", "Suscribirme")}
            </button>
          </form>
          {newsletterMessage && (
            <p className="font-serif text-sm mt-4" style={{ color: newsletterStatus === "error" ? "var(--tan)" : "var(--cream)" }}>
              {newsletterMessage}
            </p>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
