import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { RichText } from "@/components/ui/rich-text";
import type { Faq } from "@/lib/faqs";

type FaqAccordionProps = {
  items: Faq[];
  defaultOpenId?: string | null;
  className?: string;
  renderActions?: (item: Faq) => ReactNode;
};

export function FaqAccordion({ items, defaultOpenId, className, renderActions }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(() => defaultOpenId ?? items[0]?.id ?? null);

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id} className="rounded-xl shadow-sm" style={{ background: "var(--card)" }}>
            <div className="flex items-start gap-3 px-4 py-3">
              <button
                type="button"
                className="flex-1 text-left font-serif text-[15px] md:text-base"
                style={{ color: "var(--coffee)" }}
                onClick={() => toggle(item.id)}
              >
                {item.q}
              </button>
              {renderActions && <div className="flex items-center gap-2 shrink-0">{renderActions(item)}</div>}
              <button
                type="button"
                className="size-9 flex items-center justify-center shrink-0 transition-transform"
                style={{ color: "var(--forest)" }}
                onClick={() => toggle(item.id)}
                aria-label={open ? "Cerrar respuesta" : "Abrir respuesta"}
              >
                <ChevronDown className={cn("transition-transform", open && "rotate-180")} size={18} />
              </button>
            </div>
            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-4 font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>
                  <RichText text={item.a} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
