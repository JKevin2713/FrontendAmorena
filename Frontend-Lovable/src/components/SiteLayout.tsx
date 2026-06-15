import { Header } from "./Header";
import { Footer } from "./Footer";
import cafeHojaSvg from "@/assets/CafeHoja.svg";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function CoffeeLeafDivider({
  className = "",
  lineClassName = "max-w-[80px]",
}: {
  className?: string;
  lineClassName?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ color: "var(--tan-dark)" }}>
      <span className={`h-px flex-1 ${lineClassName}`} style={{ background: "var(--tan-dark)", opacity: 0.6 }} />
      <img
        src={cafeHojaSvg}
        alt=""
        aria-hidden="true"
        className="h-6 w-auto"
        style={{ filter: "invert(78%) sepia(20%) saturate(500%) hue-rotate(345deg) brightness(95%) contrast(90%)" }}
      />
      <span className={`h-px flex-1 ${lineClassName}`} style={{ background: "var(--tan-dark)", opacity: 0.6 }} />
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="py-14 px-4 text-center">
      <CoffeeLeafDivider className="max-w-3xl mx-auto mb-6 justify-center" lineClassName="max-w-[220px]" />
      <h1 className="text-5xl md:text-6xl" style={{ color: "var(--coffee)" }}>{title}</h1>
      {subtitle && (
        <p className="font-serif italic text-lg mt-3 max-w-2xl mx-auto" style={{ color: "var(--muted-foreground)" }}>
          {subtitle}
        </p>
      )}
    </section>
  );
}