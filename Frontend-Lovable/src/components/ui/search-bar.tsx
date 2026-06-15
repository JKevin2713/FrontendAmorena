import { useId } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  onSubmit?: () => void;
  className?: string;
};

export function SearchBar({
  value,
  onChange,
  label = "Buscar preguntas",
  placeholder = "Escribe una palabra clave",
  onSubmit,
  className,
}: SearchBarProps) {
  const inputId = useId();

  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <label htmlFor={inputId} className="block font-serif" style={{ color: "var(--coffee)" }}>
          {label}
        </label>
      )}
      <form
        className="flex items-center gap-2 rounded-full px-4 py-2"
        style={{ background: "var(--muted)" }}
        onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}
      >
        <input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none font-serif border-0"
        />
        <button
          type="submit"
          className="p-1 bg-transparent border-0"
          style={{ color: "var(--forest)" }}
          aria-label="Confirmar búsqueda"
        >
          <Search size={18} />
        </button>
      </form>
    </div>
  );
}
