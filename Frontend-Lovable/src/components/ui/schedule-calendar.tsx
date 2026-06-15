import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { formatDateKey, formatExceptionHours, type ScheduleException } from "@/lib/hours";
import { useLanguage } from "@/lib/language/language-context";

const WEEK_DAYS = [
  { key: "lunes", label: "Lun" },
  { key: "martes", label: "Mar" },
  { key: "miercoles", label: "Mie" },
  { key: "jueves", label: "Jue" },
  { key: "viernes", label: "Vie" },
  { key: "sabado", label: "Sab" },
  { key: "domingo", label: "Dom" },
];

type ScheduleCalendarProps = {
  month: number;
  year: number;
  exceptions: ScheduleException[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  onMonthChange?: (year: number, month: number) => void;
  className?: string;
  translated?: boolean;
};

function getMonthLabel(year: number, month: number, locale = "es-ES") {
  const label = new Date(year, month, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: Array<number | null> = [];
  for (let i = 0; i < startOffset; i += 1) days.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) days.push(day);
  while (days.length < 42) days.push(null);
  return days;
}

export function ScheduleCalendar({
  month,
  year,
  exceptions,
  selectedDate,
  onSelectDate,
  onMonthChange,
  className,
  translated = false,
}: ScheduleCalendarProps) {
  const { language, t, text } = useLanguage();
  const locale = translated && language === "en" ? "en-US" : "es-ES";
  const label = getMonthLabel(year, month, locale);
  const days = buildCalendarDays(year, month);
  const exceptionMap = new Map(exceptions.map((item) => [item.date, item]));

  const handlePrev = () => {
    const nextMonth = month - 1;
    if (nextMonth < 0) onMonthChange?.(year - 1, 11);
    else onMonthChange?.(year, nextMonth);
  };

  const handleNext = () => {
    const nextMonth = month + 1;
    if (nextMonth > 11) onMonthChange?.(year + 1, 0);
    else onMonthChange?.(year, nextMonth);
  };

  return (
    <div className={cn("rounded-2xl border p-6 shadow-sm", className)} style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between">
        <button type="button" onClick={handlePrev} className="p-2" style={{ color: "var(--forest)" }} aria-label={translated ? t("hours.calendar.prev", "Mes anterior") : "Mes anterior"}>
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-2xl" style={{ color: "var(--coffee)" }}>{label}</h3>
        <button type="button" onClick={handleNext} className="p-2" style={{ color: "var(--forest)" }} aria-label={translated ? t("hours.calendar.next", "Mes siguiente") : "Mes siguiente"}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted-foreground)" }}>
        {WEEK_DAYS.map((day) => (
          <div key={day.key} className="text-center">
            {translated ? t(`hours.weekday.short.${day.key}`, day.label) : day.label}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-7 gap-3">
        {days.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;

          const dateKey = formatDateKey(year, month, day);
          const exception = exceptionMap.get(dateKey);
          const isSelected = selectedDate === dateKey;
          const exceptionLabel = exception
            ? exception.type === "cierre"
              ? translated ? t("hours.calendar.closed", "Cerrado") : "Cerrado"
              : translated
                ? text(exception.motivo, exception.motivoEn) || t("hours.calendar.special", "Horario especial")
                : exception.motivo || "Horario especial"
            : "";



          let background = "transparent";
          let color = "var(--coffee)";
          let border = "2px solid transparent";


          if (exception?.type === "cambio") {
            border = "2px solid var(--forest)";
          } else if (exception?.type === "cierre") {
            border = "2px solid var(--destructive)";
          } else if (exception?.type === "cerrar_reservas") {
            border = "2px solid #FF9500";
          }


          if (isSelected) {
            background = "var(--tan)";
          }
          const style: CSSProperties = {
            background,
            color,
            border,
          };

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate?.(dateKey)}
              className={cn(
                "min-h-[74px] rounded-xl p-2 text-center flex flex-col items-center justify-start transition-shadow",
                onSelectDate && "cursor-pointer hover:shadow-sm",
                !onSelectDate && "cursor-default",
              )}
              style={style}
            >
              <div className="text-sm font-semibold">{day}</div>
              {exception && (
                <div className="mt-1 text-[10px] leading-snug text-center">
                  <div className="uppercase tracking-[0.12em]">
                    {exceptionLabel}
                  </div>
                  {exception.type === "cambio" && formatExceptionHours(exception) && (
                    <div className="mt-1">{formatExceptionHours(exception)}</div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
