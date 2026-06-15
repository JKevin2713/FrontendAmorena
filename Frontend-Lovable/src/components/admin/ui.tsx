import { ReactNode, forwardRef } from "react";
import { X } from "lucide-react";

export function Card({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-6 ${className}`}
      style={{ background: "var(--card)", border: "1px solid var(--tan-dark)", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}
    >
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block font-serif font-semibold mb-1.5" style={{ color: "var(--coffee)" }}>{label}</span>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={"w-full px-3 py-2 rounded font-serif outline-none focus:ring-2 " + (props.className ?? "")}
      style={{ background: "var(--cream)", border: "1px solid var(--tan-dark)", color: "var(--coffee)" }}
    />
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  (props, ref) => (
    <textarea
      {...props}
      ref={ref}
      className={"w-full px-3 py-2 rounded font-serif outline-none min-h-[90px] " + (props.className ?? "")}
      style={{ background: "var(--cream)", border: "1px solid var(--tan-dark)", color: "var(--coffee)" }}
    />
  ),
);
Textarea.displayName = "Textarea";

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={"w-full px-3 py-2 rounded font-serif outline-none " + (props.className ?? "")}
      style={{ background: "var(--cream)", border: "1px solid var(--tan-dark)", color: "var(--coffee)" }}
    />
  );
}

export function Btn({ children, variant = "primary", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "danger" }) {
  const base = "px-4 py-2 rounded font-serif font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5";
  const styles =
    variant === "primary"
      ? { background: "var(--forest)", color: "var(--cream)" }
      : variant === "danger"
        ? { background: "var(--destructive)", color: "var(--cream)" }
        : { background: "transparent", color: "var(--forest)", border: "1.5px solid var(--forest)" };
  return <button {...p} className={base + " " + (p.className ?? "")} style={styles}>{children}</button>;
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--tan-dark)" }}>
      <table className="w-full text-left font-serif">
        <thead style={{ background: "var(--tan)" }}>
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold" style={{ color: "var(--coffee)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(47,36,29,.42)", backdropFilter: "blur(3px)" }} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-lg p-6 relative"
        style={{ background: "var(--card)", border: "1px solid var(--tan-dark)", boxShadow: "0 24px 70px rgba(47,36,29,.22)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full size-8 inline-flex items-center justify-center"
          style={{ color: "var(--coffee)", background: "var(--cream)", border: "1px solid var(--tan-dark)" }}
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
        <h2 className="text-3xl mb-4 pr-10" style={{ color: "var(--forest)" }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
