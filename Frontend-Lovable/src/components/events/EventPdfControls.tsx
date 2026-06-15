import { Download, FileDown, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ApiEvento } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Language } from "@/lib/language/language-context";
import { useLanguage } from "@/lib/language/language-context";
import {
  downloadEventsPdf,
  getTodayIso,
  isEventWithinDateRange,
  type EventPdfOptions,
  type EventPdfTextSize,
} from "@/lib/event-pdf";

type EventPdfControlsProps = {
  events: ApiEvento[];
  disabled?: boolean;
};

const textSizeOptions: Array<{ value: EventPdfTextSize; labelKey: string; fallback: string }> = [
  { value: "standard", labelKey: "events.pdf.size.standard", fallback: "Normal" },
  { value: "large", labelKey: "events.pdf.size.large", fallback: "Grande" },
  { value: "extraLarge", labelKey: "events.pdf.size.extraLarge", fallback: "Extra grande" },
];

export function EventPdfControls({ events, disabled = false }: EventPdfControlsProps) {
  const { language, t, text, translate } = useLanguage();
  const [open, setOpen] = useState(false);
  const [pdfLanguage, setPdfLanguage] = useState<Language>(language);
  const [textSize, setTextSize] = useState<EventPdfTextSize>("standard");
  const [startDate, setStartDate] = useState(getTodayIso);
  const [endDate, setEndDate] = useState("");
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const defaultStartDate = useMemo(() => getTodayIso(), []);
  const defaultEvents = useMemo(
    () => events.filter((event) => isEventWithinDateRange(event, defaultStartDate)),
    [defaultStartDate, events],
  );
  const rangeEvents = useMemo(
    () => events.filter((event) => isEventWithinDateRange(event, startDate, endDate)),
    [endDate, events, startDate],
  );
  const allCategoryNames = useMemo(() => Array.from(new Set(events.map((event) => event.categoria || "Otro"))), [events]);
  const eventIds = useMemo(() => rangeEvents.map((event) => event._id), [rangeEvents]);
  const activeEventIds = selectedEventIds.length > 0 ? selectedEventIds : eventIds;
  const selectedEventCount = rangeEvents.filter((event) => activeEventIds.includes(event._id)).length;

  useEffect(() => {
    if (!open) setPdfLanguage(language);
  }, [language, open]);

  const getLabels = (targetLanguage: Language) => ({
    title: translate(targetLanguage, "events.pdf.title", "Eventos actualizados"),
    subtitle: translate(targetLanguage, "events.pdf.subtitle", "Fechas, detalles y actividades para compartir."),
    generated: translate(targetLanguage, "events.pdf.generated", "Generado el"),
    empty: translate(targetLanguage, "events.pdf.empty", "No hay eventos para mostrar con esta configuración."),
    featured: translate(targetLanguage, "events.featured", "Destacado"),
    date: translate(targetLanguage, "events.pdf.date", "Fecha"),
    time: translate(targetLanguage, "events.pdf.time", "Hora"),
    category: translate(targetLanguage, "events.pdf.category", "Categoría"),
    location: translate(targetLanguage, "events.location.default", "Jardín principal"),
    noDate: translate(targetLanguage, "events.pdf.noDate", "Fecha por confirmar"),
    dateRange: translate(targetLanguage, "events.pdf.dateRange", "Rango de fechas"),
    upcomingOnly: translate(targetLanguage, "events.pdf.upcomingOnly", "Eventos desde hoy en adelante"),
    from: translate(targetLanguage, "events.pdf.from", "desde"),
    to: translate(targetLanguage, "events.pdf.to", "hasta"),
  });

  const defaultOptions: EventPdfOptions = {
    language,
    categoryNames: allCategoryNames,
    eventIds: events.map((event) => event._id),
    textSize: "standard",
    startDate: defaultStartDate,
  };

  const downloadDefault = async () => {
    setGenerating(true);
    try {
      await downloadEventsPdf(events, defaultOptions, getLabels(defaultOptions.language));
    } finally {
      setGenerating(false);
    }
  };

  const downloadCustom = async () => {
    const customOptions: EventPdfOptions = {
      language: pdfLanguage,
      categoryNames: allCategoryNames,
      eventIds: activeEventIds,
      textSize,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    setGenerating(true);
    try {
      await downloadEventsPdf(events, customOptions, getLabels(customOptions.language));
      setOpen(false);
    } finally {
      setGenerating(false);
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEventIds((current) => {
      const base = current.length > 0 ? current : eventIds;
      const next = base.includes(eventId)
        ? base.filter((id) => id !== eventId)
        : [...base, eventId];
      return next.length === eventIds.length ? [] : next;
    });
  };

  const selectAll = () => {
    setSelectedEventIds([]);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        type="button"
        className="btn-primary justify-center text-sm"
        onClick={downloadDefault}
        disabled={disabled || generating || defaultEvents.length === 0}
      >
        <Download size={14} /> {generating ? t("events.pdf.generating", "Generando...") : t("events.download.button", "Descargar")}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="btn-outline justify-center text-sm px-4 py-2"
            disabled={disabled || generating || events.length === 0}
          >
            <Settings2 size={14} /> {t("events.pdf.customize", "Personalizar PDF")}
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--card)", color: "var(--coffee)" }}>
          <DialogHeader>
            <DialogTitle className="font-script text-4xl font-normal" style={{ color: "var(--forest)" }}>
              {t("events.pdf.dialogTitle", "Configura tus eventos")}
            </DialogTitle>
            <DialogDescription className="font-serif" style={{ color: "var(--muted-foreground)" }}>
              {t("events.pdf.dialogDescription", "Elige idioma, rango de fechas, eventos y tamaño de lectura.")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="grid gap-2 font-serif text-sm">
                <span className="font-semibold">{t("events.pdf.language", "Idioma")}</span>
                <Select value={pdfLanguage} onValueChange={(value) => setPdfLanguage(value as Language)}>
                  <SelectTrigger style={{ background: "var(--cream)", borderColor: "var(--border)" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">{t("header.languageSpanish", "Español")}</SelectItem>
                    <SelectItem value="en">{t("header.languageEnglish", "Inglés")}</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="grid gap-2 font-serif text-sm">
                <span className="font-semibold">{t("events.pdf.startDate", "Desde")}</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    setSelectedEventIds([]);
                  }}
                  className="h-9 rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--cream)", borderColor: "var(--border)", color: "var(--coffee)" }}
                />
              </label>

              <label className="grid gap-2 font-serif text-sm">
                <span className="font-semibold">{t("events.pdf.endDate", "Hasta")}</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    setSelectedEventIds([]);
                  }}
                  className="h-9 rounded-md border px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--cream)", borderColor: "var(--border)", color: "var(--coffee)" }}
                />
              </label>
            </div>

            <label className="grid gap-2 font-serif text-sm">
              <span className="font-semibold">{t("events.pdf.textSize", "Tamaño de texto")}</span>
              <Select value={textSize} onValueChange={(value) => setTextSize(value as EventPdfTextSize)}>
                <SelectTrigger style={{ background: "var(--cream)", borderColor: "var(--border)" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {textSizeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey, option.fallback)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <section className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-serif text-sm font-semibold">{t("events.pdf.events", "Eventos")}</p>
                  <p className="font-serif text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {selectedEventCount} {t("events.pdf.eventsSelected", "eventos seleccionados")}
                  </p>
                </div>
                <button
                  type="button"
                  className="font-serif text-xs rounded-md px-3 py-1.5"
                  style={{ border: "1px solid var(--forest)", color: "var(--forest)" }}
                  onClick={selectAll}
                >
                  {t("events.pdf.selectAll", "Todos")}
                </button>
              </div>

              <div className="grid gap-2 max-h-56 overflow-y-auto pr-1">
                {rangeEvents.map((event) => {
                  const checked = activeEventIds.includes(event._id);
                  return (
                    <label
                      key={event._id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 font-serif text-sm"
                      style={{ background: checked ? "var(--cream)" : "transparent", border: "1px solid var(--border)" }}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleEvent(event._id)} />
                      <span className="min-w-0 flex-1 truncate">{text(event.nombre, event.nombre_en)}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              className="btn-primary justify-center"
              disabled={generating || selectedEventCount === 0}
              onClick={downloadCustom}
            >
              <FileDown size={16} /> {generating ? t("events.pdf.generating", "Generando...") : t("events.pdf.downloadCustom", "Descargar PDF")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
