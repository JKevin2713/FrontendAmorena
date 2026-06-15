import { createFileRoute } from "@tanstack/react-router";
import { CoffeeLeafDivider, SiteLayout } from "@/components/SiteLayout";
import { MessageSquareText } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/language/language-context";
import { fetchRegularSchedule, fetchScheduleExceptions, type ScheduleEntry, type ScheduleException } from "@/lib/hours";

export const Route = createFileRoute("/reservas")({
  validateSearch: (search: Record<string, unknown>) => ({
    date: typeof search.date === "string" ? search.date : "",
    minTime: typeof search.minTime === "string" ? search.minTime : "00:00",
    maxTime: typeof search.maxTime === "string" ? search.maxTime : "23:59",
  }),
  head: () => ({
    meta: [
      { title: "Reservas — Amorena" },
      { name: "description", content: "Reserva tu mesa en Amorena Coffee & Garden." },
    ],
  }),
  component: ReservasPage,
});

function ReservasPage() {
  const { date, minTime, maxTime } = Route.useSearch();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    nombreCompleto: "",
    telefono: "",
    correoElectronico: "",
    fecha: date || "",
    hora: "",
    cantidadPersonas: 2,
    notas: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);

  useEffect(() => {
    fetchRegularSchedule().then(setSchedule).catch(console.error);
  }, []);

  useEffect(() => {
    if (!formData.fecha) return;
    const [y, m] = formData.fecha.split("-").map(Number);
    if (!y || !m) return;
    fetchScheduleExceptions(y, m - 1).then(data => {
      setExceptions(prev => {
        const newEx = data.filter(d => !prev.some(p => p.id === d.id));
        return [...prev, ...newEx];
      });
    }).catch(console.error);
  }, [formData.fecha.substring(0, 7)]);

  let currentMinTime = minTime;
  let currentMaxTime = maxTime;

  if (formData.fecha && schedule.length > 0) {
    const [y, m, d] = formData.fecha.split("-").map(Number);
    if (y && m && d) {
      const dateObj = new Date(y, m - 1, d);
      const dayName = dateObj.toLocaleDateString("es-ES", { weekday: "long" });
      const normalizedTarget = dayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const exception = exceptions.find(ex => ex.date.startsWith(formData.fecha));

      if (exception?.type === "cambio") {
        currentMinTime = exception.open || "00:00";
        currentMaxTime = exception.close || "23:59";
      } else if (!exception || exception.type === "cerrar_reservas" || exception.type === "cierre") {
        const regularDay = schedule.find(s => s.day.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedTarget);
        if (regularDay) {
          currentMinTime = regularDay.open;
          currentMaxTime = regularDay.close;
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.fecha < currentMinTime || formData.fecha > currentMaxTime) {
      // The condition was comparing fecha with minTime before! Bug fix: should compare hora
    }

    if (formData.hora < currentMinTime || formData.hora > currentMaxTime) {
      setError(`${t("reservas.error.outOfHours", "La hora seleccionada esta fuera del horario permitido")} (${currentMinTime} - ${currentMaxTime}).`);
      setLoading(false);
      return;
    }
    try {
      await api.reservas.create(formData);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reservas.error.generic", "Ocurrio un error al enviar tu reserva."));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SiteLayout>
        <section className="px-4 py-20 min-h-[60vh] flex flex-col items-center justify-center text-center">
          <div className="mx-auto max-w-lg">
            <h1 className="mt-2 text-5xl md:text-6xl mb-6" style={{ color: "var(--forest)" }}>
              {t("reservas.success.title", "Reserva Solicitada!")}
            </h1>
            <CoffeeLeafDivider className="mx-auto mb-6" />
            <p className="font-serif text-lg" style={{ color: "var(--coffee)" }}>
              {t("reservas.success.receivedBeforeDate", "Hemos recibido tu solicitud de reserva para el")} <strong>{formData.fecha}</strong> {t("reservas.success.receivedBeforeTime", "a las")} <strong>{formData.hora}</strong>.
            </p>
            <p className="font-serif mt-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
              {t("reservas.success.confirmation", "Te enviaremos un correo de confirmacion pronto. Te esperamos!")}
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-8 px-6 py-3 rounded-xl font-serif text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "var(--forest)", color: "var(--cream)" }}
            >
              {t("reservas.success.again", "Hacer otra reserva")}
            </button>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="px-4 pt-16 pb-20">
        <div className="mx-auto max-w-4xl flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2 font-serif text-sm uppercase tracking-widest font-semibold" style={{ color: "var(--forest)" }}>
            <span>{t("reservas.eyebrow", "Sistema de Reservas")}</span>
            <MessageSquareText size={16} />
          </div>

          <h1 className="text-5xl md:text-6xl text-center" style={{ color: "var(--forest)" }}>
            {t("reservas.title", "Cuéntanos cuando nos visitas")}
          </h1>

          <CoffeeLeafDivider className="mt-6 mb-10 w-full max-w-lg mx-auto" />

          {error && (
            <div className="w-full max-w-2xl p-4 mb-6 rounded-lg text-sm font-serif text-center" style={{ background: "rgba(243, 217, 209, 0.65)", color: "var(--destructive)" }}>
              {error}
            </div>
          )}

          <div className="w-full max-w-2xl rounded-2xl p-6 md:p-8" style={{ background: "var(--tan)" }}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              <div className="flex flex-col gap-1.5">
                <label className="font-serif text-sm font-semibold" style={{ color: "var(--coffee)" }}>
                  {t("reservas.name", "Nombre Completo")}
                </label>
                <input
                  required
                  type="text"
                  placeholder={t("reservas.namePlaceholder", "Tu nombre")}
                  value={formData.nombreCompleto}
                  onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg font-serif text-sm outline-none"
                  style={{ background: "var(--cream)", border: "1px solid var(--border)", color: "var(--coffee)" }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-sm font-semibold" style={{ color: "var(--coffee)" }}>
                    {t("reservas.phone", "Teléfono")}
                  </label>
                  <input
                    required
                    type="tel"
                    pattern="[678][0-9]{7}"
                    title={t("reservas.phoneTitle", "El telefono debe tener 8 digitos y comenzar con 6, 7 u 8")}
                    placeholder="88776655"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg font-serif text-sm outline-none"
                    style={{ background: "var(--cream)", border: "1px solid var(--border)", color: "var(--coffee)" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-sm font-semibold" style={{ color: "var(--coffee)" }}>
                    {t("reservas.email", "Correo Electrónico")}
                  </label>
                  <input
                    required
                    type="email"
                    pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
                    title={t("reservas.emailTitle", "Ingresa un correo electronico valido")}
                    placeholder="tu@correo.com"
                    value={formData.correoElectronico}
                    onChange={(e) => setFormData({ ...formData, correoElectronico: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg font-serif text-sm outline-none"
                    style={{ background: "var(--cream)", border: "1px solid var(--border)", color: "var(--coffee)" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-sm font-semibold" style={{ color: "var(--coffee)" }}>
                    {t("reservas.date", "Fecha")}
                  </label>
                  <input
                    required
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg font-serif text-sm outline-none"
                    style={{ background: "var(--cream)", border: "1px solid var(--border)", color: "var(--coffee)" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-sm font-semibold" style={{ color: "var(--coffee)" }}>
                    {t("reservas.time", "Hora")}
                  </label>
                  <input
                    required
                    type="time"
                    min={currentMinTime}
                    max={currentMaxTime}
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg font-serif text-sm outline-none"
                    style={{ background: "var(--cream)", border: "1px solid var(--border)", color: "var(--coffee)" }}
                  />
                  <span className="font-serif text-xs" style={{ color: "var(--muted-foreground)" }}>{t("reservas.timeRange", "Horario de")} {currentMinTime} a {currentMaxTime}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-serif text-sm font-semibold" style={{ color: "var(--coffee)" }}>
                    {t("reservas.people", "Personas")}
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.cantidadPersonas}
                    onChange={(e) => setFormData({ ...formData, cantidadPersonas: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 rounded-lg font-serif text-sm outline-none"
                    style={{ background: "var(--cream)", border: "1px solid var(--border)", color: "var(--coffee)" }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-serif text-sm font-semibold" style={{ color: "var(--coffee)" }}>
                  {t("reservas.notes", "Notas (Opcional)")}
                </label>
                <textarea
                  rows={3}
                  placeholder={t("reservas.notesPlaceholder", "¿Alguna ocasión especial? ¿Preferencias?")}
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg font-serif text-sm outline-none resize-none"
                  style={{ background: "var(--cream)", border: "1px solid var(--border)", color: "var(--coffee)" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-serif text-sm font-semibold transition-all hover:opacity-90 mt-2 disabled:opacity-50"
                style={{ background: "var(--forest)", color: "var(--cream)" }}
              >
                {loading ? t("reservas.loading", "Enviando...") : t("reservas.submit", "Reservar mi mesa")}
              </button>
            </form>
          </div>

          <p className="font-serif text-xs mt-6 text-center" style={{ color: "var(--coffee)" }}>
            {t("reservas.disclaimer", "Confirmaremos tu reserva por correo en menos de 2 horas.")}
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
