import { Field, Select } from "@/components/admin/ui";
import type { LanguageSection } from "@/lib/language/admin";

const SECTION_OPTIONS: Array<{ id: LanguageSection; label: string }> = [
  { id: "faqs", label: "Preguntas frecuentes" },
  { id: "horarios", label: "Horarios" },
  { id: "menu", label: "Menú" },
  { id: "promociones", label: "Promociones" },
  { id: "eventos", label: "Eventos" },
  { id: "resenas", label: "Reseñas" },
  { id: "home", label: "Inicio" },
  { id: "conozcanos", label: "Conozcanos" },
  { id: "reservas", label: "Reservas" },
  { id: "pedidos", label: "Pedidos" },
  { id: "footer", label: "Pie de página" },
];

const MONTH_OPTIONS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

function getYearOptions() {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, index) => String(current - 1 + index));
}

type LanguageSectionFiltersProps = {
  section: LanguageSection;
  month: string;
  onSectionChange: (section: LanguageSection) => void;
  onMonthChange: (month: string) => void;
};

export function LanguageSectionFilters({ section, month, onSectionChange, onMonthChange }: LanguageSectionFiltersProps) {
  const [selectedYear, selectedMonth] = month.split("-");
  const yearOptions = getYearOptions();

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(220px,320px)_180px_180px]">
      <Field label="Sección">
        <Select value={section} onChange={(event) => onSectionChange(event.target.value as LanguageSection)}>
          {SECTION_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </Select>
      </Field>
      {section === "horarios" && (
        <>
          <Field label="Mes">
            <Select value={selectedMonth} onChange={(event) => onMonthChange(`${selectedYear}-${event.target.value}`)}>
              {MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Año">
            <Select value={selectedYear} onChange={(event) => onMonthChange(`${event.target.value}-${selectedMonth}`)}>
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Select>
          </Field>
        </>
      )}
    </div>
  );
}
