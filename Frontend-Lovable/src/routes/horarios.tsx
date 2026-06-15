import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CoffeeLeafDivider, SiteLayout } from "@/components/SiteLayout";
import { Clock, HandHelping } from "lucide-react";
import { useEffect, useState } from "react";
import { ScheduleCalendar } from "@/components/ui/schedule-calendar";
import { fetchRegularSchedule, fetchScheduleExceptions, type ScheduleEntry, type ScheduleException } from "../lib/hours";
import { normalizeLanguageKey, useLanguage } from "@/lib/language/language-context";

export const Route = createFileRoute("/horarios")({
  head: () => ({
    meta: [
      { title: "Horarios — Amorena" },
      { name: "description", content: "Consulta los horarios de Amorena Coffee & Garden y planea tu visita." },
      { property: "og:title", content: "Horarios — Amorena" },
    ],
  }),
  component: HoursPage,
});

function HoursPage() {
  const todayObj = new Date();
  const todayName = todayObj.toLocaleDateString("es-ES", { weekday: "long" });
  const todayNormalized = todayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const { t, text } = useLanguage();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const navigate = useNavigate();
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingExceptions, setLoadingExceptions] = useState(true);
  const [view, setView] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  // Estado para capturar mensajes de error al intentar reservar
  const [reservationError, setReservationError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadSchedule = async () => {
      setLoadingSchedule(true);
      try {
        const data = await fetchRegularSchedule();
        if (!active) return;
        setSchedule(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : t("hours.error.schedule", "No se pudo cargar el horario."));
      } finally {
        if (!active) return;
        setLoadingSchedule(false);
      }
    };
    loadSchedule();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadExceptions = async () => {
      setLoadingExceptions(true);
      try {
        const data = await fetchScheduleExceptions(view.year, view.month);
        if (!active) return;
        setExceptions(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : t("hours.error.exceptions", "No se pudieron cargar las excepciones."));
      } finally {
        if (!active) return;
        setLoadingExceptions(false);
      }
    };
    loadExceptions();
    return () => {
      active = false;
    };
  }, [view.month, view.year]);

  // Limpiar el mensaje de error de reserva cuando cambie la fecha elegida
  useEffect(() => {
    setReservationError(null);
  }, [selectedDate]);


  const getLimitsForDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayName = dateObj.toLocaleDateString("es-ES", { weekday: "long" });
    const normalizedTarget = dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const exception = exceptions.find(ex => ex.date.startsWith(dateStr));

    if (exception?.type === "cambio") {
      return {
        open: exception.open || "00:00",
        close: exception.close || "23:59"
      };
    }

    const regular = schedule.find(s => s.day.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedTarget);

    return {
      open: regular?.open || "00:00",
      close: regular?.close || "23:59"
    };
  };
  const checkAvailability = () => {
    if (!selectedDate) return { isAvailable: false, reason: "" };

    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (isNaN(dateObj.getTime())) return { isAvailable: false, reason: t("hours.errInvalidDate", "Fecha invalida.") };

    const exception = exceptions.find(ex => ex.date.startsWith(selectedDate));

    if (exception) {
      if (exception.type === "cerrar_reservas") {
        return {
          isAvailable: false,
          reason: t("hours.errNoReservations", "No se permiten más reservas en esta fecha.")
        };
      }

      if (exception.type === "cierre") {
        return { isAvailable: false, reason: t("hours.errClosed", "Este día nos encontramos cerrados.") };
      }

      return { isAvailable: true, reason: "" };
    }

    const dayNameInSpanish = dateObj.toLocaleDateString("es-ES", { weekday: "long" });
    const normalizedTarget = dayNameInSpanish.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const regularDay = schedule.find(s => s.day.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedTarget);

    if (!regularDay) {
       return { isAvailable: false, reason: t("hours.errClosed", "Este día nos encontramos cerrados.") };
    }



    return { isAvailable: true, reason: "" };



  };

  const availability = checkAvailability();

  const handleReservationSubmit = () => {
    if (!selectedDate) return;

    if (!availability.isAvailable) {
      setReservationError(availability.reason);
      return;
    }

    const dateObj = new Date(selectedDate);
    const formattedDate = dateObj.toISOString().split('T')[0];

    const limits = getLimitsForDate(formattedDate);
    navigate({ to: "/reservas", search: { date: formattedDate, minTime: limits?.open, maxTime: limits?.close } });
  }



  const handleSelectDate = (date: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    if (date < todayStr) {
      setReservationError(t("hours.errPastDate", "No se pueden hacer reservas en fechas pasadas."));
      return;
    }
    setSelectedDate(date);
    setReservationError(null);
  };



  return (
    <SiteLayout>
      <section className="px-4 pt-10 pb-8">
        <div className="mx-auto max-w-6xl">
          <p className="font-serif text-xs uppercase tracking-[0.3em]" style={{ color: "var(--tan-dark)" }}>{t("hours.eyebrow", "Centro de horarios")}</p>
          <h1 className="mt-2 text-5xl md:text-6xl" style={{ color: "var(--forest)" }}>{t("hours.title", "Planifique su visita")}</h1>
          <CoffeeLeafDivider className="mt-4" lineClassName="max-w-none" />
          <p className="mt-4 max-w-xl font-serif" style={{ color: "var(--muted-foreground)" }}>
            {t("hours.intro", "Descubre el ritmo de nuestra cafetería. Desde amaneceres con aroma a café hasta atardeceres gastronómicos.")}
          </p>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[320px_1fr] items-start">
          <div className="grid gap-6">
            <div className="rounded-2xl border p-6 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3 mb-6">
                <Clock style={{ color: "var(--forest)" }} />
                <h2 className="text-2xl" style={{ color: "var(--forest)" }}>{t("hours.regularTitle", "Horario habitual")}</h2>
              </div>
              {error && (
                <p className="mb-4 text-sm font-serif" style={{ color: "var(--destructive)" }}>
                  {error}
                </p>
              )}
              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {loadingSchedule && (
                  <li className="py-3 font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
                    {t("hours.loading", "Cargando horario...")}
                  </li>
                )}
                {!loadingSchedule && schedule.length === 0 && (
                  <li className="py-3 font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
                    {t("hours.empty", "No hay horarios disponibles.")}
                  </li>
                )}
                {schedule.map((s) => {
                  const sNormalized = s.day.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  const isToday = sNormalized === todayNormalized;
                  const hours = s.open && s.close ? `${s.open} - ${s.close}` : t("hours.closed", "Cerrado");
                  const dayLabel = text(s.day, s.dayEn) || t(`hours.day.${normalizeLanguageKey(s.day)}`, s.day);
                  return (
                    <li
                      key={s.day}
                      className="flex justify-between py-3 font-serif text-sm"
                      style={isToday ? { color: "var(--forest)", fontWeight: 600 } : { color: "var(--coffee)" }}
                    >
                      <span>{dayLabel}{isToday && ` · ${t("hours.today", "hoy")}`}</span>
                      <span>{hours}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-2xl border p-6 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <h3 className="text-sm font-semibold tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                {t("hours.calendarReference", "Referencia de calendario")}
              </h3>
              <div className="mt-4 grid gap-3 text-sm font-serif" style={{ color: "var(--coffee)" }}>
                <div className="flex items-center gap-3">
                  <span className="size-3 rounded-full" style={{ border: "2px solid var(--forest)" }} />
                  {t("hours.specialEvents", "Horario especial (eventos)")}
                </div>
                <div className="flex items-center gap-3">
                  <span className="size-3 rounded-full" style={{ border: "2px solid var(--destructive)" }} />
                  {t("hours.closedHoliday", "Cerrado o festivo")}
                </div>
                <div className="flex items-center gap-3">
                  <span className="size-3 rounded-full" style={{ border: "2px solid #FF9500" }} />
                  {t("hours.noReservations", "Sin cupo de reservas")}
                </div>
                <div className="flex items-center gap-3">
                  <span className="size-3 rounded-full" style={{ background: "var(--tan)", border: "2px solid var(--tan-dark)" }} />
                  {t("hours.selected", "Seleccionado")}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <ScheduleCalendar
              month={view.month}
              year={view.year}
              exceptions={exceptions}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              translated
              onMonthChange={(year, month) => setView({ year, month })}
            />

            {selectedDate && (
              <div className="flex flex-col items-end gap-2">
                {/* Alerta visible si el usuario interactúa o si la fecha ya está marcada como no disponible */}
                {reservationError && (
                  <p className="text-sm font-serif font-medium" style={{ color: "var(--destructive)" }}>
                    {reservationError}
                  </p>
                )}

                <button
                  onClick={handleReservationSubmit}
                  className="px-6 py-3 rounded-xl font-serif text-sm font-semibold transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background: availability.isAvailable ? "var(--forest)" : "var(--muted-foreground)",
                    color: "var(--cream)"
                  }}
                >
                  {t("hours.reserveBtn", "Reservar la fecha seleccionada")}
                </button>
              </div>
            )}
          </div>
          {loadingExceptions && (
            <p className="mt-3 text-sm font-serif" style={{ color: "var(--muted-foreground)" }}>
              {t("hours.exceptionsLoading", "Cargando excepciones del mes...")}
            </p>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
