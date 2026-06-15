import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/admin/ui";

type CollapsibleSectionProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function CollapsibleSection({ title, subtitle, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <span>
          <span className="block text-2xl" style={{ color: "var(--forest)" }}>{title}</span>
          <span className="block font-serif text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>{subtitle}</span>
        </span>
        <ChevronDown
          className="mt-1 shrink-0 transition-transform"
          style={{ color: "var(--forest)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          size={20}
        />
      </button>
      {open && <div className="mt-5">{children}</div>}
    </Card>
  );
}
