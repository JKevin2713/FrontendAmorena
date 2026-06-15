import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { createPublicReview, usePublicReviews } from "@/lib/reviews";
import { useLanguage } from "@/lib/language/language-context";

export const Route = createFileRoute("/resenas")({
  head: () => ({
    meta: [
      { title: "Reseñas - Amorena" },
      { name: "description", content: "Comparte tu experiencia en Amorena Coffee & Garden y lee reseñas de nuestra página." },
    ],
  }),
  component: ReviewsPage,
});

function Stars({ value, onChange, size = 28, label }: { value: number; onChange?: (value: number) => void; size?: number; label: string }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} ${label}`}
          className={onChange ? "transition-transform hover:scale-110" : ""}
        >
          <Star size={size} fill={n <= value ? "currentColor" : "transparent"} style={{ color: "var(--forest)" }} />
        </button>
      ))}
    </div>
  );
}

function inputCls() {
  return "w-full mt-1 px-3 py-2.5 rounded-lg border font-serif outline-none";
}

function ReviewsPage() {
  const { t, text } = useLanguage();
  const { items, loading } = usePublicReviews();
  const [form, setForm] = useState({ name: "", email: "", rating: 5, text: "" });
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const recentReviews = useMemo(() => items.slice(0, 6), [items]);
  const canSubmit = form.name.trim() && form.text.trim().length >= 5;
  const starsLabel = t("reviews.starsAria", "estrellas");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    setError("");

    try {
      await createPublicReview({
        name: form.name.trim(),
        email: form.email.trim(),
        rating: form.rating,
        text: form.text.trim(),
      });
      setForm({ name: "", email: "", rating: 5, text: "" });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reviews.form.error", "No se pudo enviar la reseña."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SiteLayout>
      <PageHeader title={t("reviews.header.title", "Déjanos tu reseña")} />

      <section className="px-4 pb-24">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-[1fr_0.9fr] gap-8 items-start">
          <div className="rounded-lg border p-6 md:p-8 shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <h2 className="text-4xl mb-2" style={{ color: "var(--coffee)" }}>{t("reviews.form.title", "Comparte tu experiencia")}</h2>
            <p className="font-serif mb-6" style={{ color: "var(--muted-foreground)" }}>
              {t("reviews.form.subtitle", "Tu opinión nos ayuda a mejorar y también guía a quienes nos visitan por primera vez.")}
            </p>

            {sent && (
              <p className="mb-4 rounded-lg px-4 py-3 font-serif text-sm" style={{ background: "var(--tan)", color: "var(--coffee)" }}>
                {t("reviews.form.success", "Gracias por compartir tu experiencia.")}
              </p>
            )}

            {error && (
              <p className="mb-4 font-serif text-sm" style={{ color: "var(--destructive)" }}>
                {error}
              </p>
            )}

            <form className="space-y-4" onSubmit={submit}>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block font-serif" style={{ color: "var(--coffee)" }}>
                  {t("reviews.form.name", "Nombre")}
                  <input
                    required
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className={inputCls()}
                    style={{ background: "var(--cream)", borderColor: "var(--border)" }}
                  />
                </label>
                <label className="block font-serif" style={{ color: "var(--coffee)" }}>
                  {t("reviews.form.email", "Correo")}
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    className={inputCls()}
                    style={{ background: "var(--cream)", borderColor: "var(--border)" }}
                  />
                </label>
              </div>

              <div>
                <p className="font-serif mb-2" style={{ color: "var(--coffee)" }}>{t("reviews.form.rating", "Calificación")}</p>
                <Stars value={form.rating} onChange={(rating) => setForm({ ...form, rating })} label={starsLabel} />
              </div>

              <label className="block font-serif" style={{ color: "var(--coffee)" }}>
                {t("reviews.form.review", "Tu reseña")}
                <textarea
                  required
                  rows={5}
                  value={form.text}
                  onChange={(event) => setForm({ ...form, text: event.target.value })}
                  className={`${inputCls()} resize-none`}
                  style={{ background: "var(--cream)", borderColor: "var(--border)" }}
                />
              </label>

              <button type="submit" disabled={!canSubmit || saving} className="btn-primary w-full justify-center disabled:opacity-60">
                {saving ? t("reviews.form.loading", "Enviando...") : t("reviews.form.submit", "Enviar reseña")}
              </button>
            </form>
          </div>

          <div className="rounded-lg border p-6 md:p-8" style={{ background: "var(--cream)", borderColor: "var(--tan-dark)" }}>
            <h2 className="text-4xl mb-5" style={{ color: "var(--forest)" }}>{t("reviews.published.title", "Reseñas publicadas")}</h2>
            {loading ? (
              <p className="font-serif" style={{ color: "var(--muted-foreground)" }}>{t("reviews.loading", "Cargando reseñas...")}</p>
            ) : recentReviews.length === 0 ? (
              <p className="font-serif" style={{ color: "var(--muted-foreground)" }}>{t("reviews.empty", "Aún no hay reseñas publicadas.")}</p>
            ) : (
              <div className="space-y-4">
                {recentReviews.map((review) => (
                  <article key={review.id} className="rounded-lg border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    <Stars value={review.rating} size={16} label={starsLabel} />
                    <p className="font-serif mt-3 leading-relaxed" style={{ color: "var(--coffee)" }}>
                      "{text(review.text, review.text_en)}"
                    </p>
                    <p className="font-serif font-semibold mt-3 text-sm" style={{ color: "var(--forest)" }}>
                      - {review.name}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
