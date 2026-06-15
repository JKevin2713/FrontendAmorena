import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Star, Trash2 } from "lucide-react";
import { AdminTitle } from "@/components/admin/AdminLayout";
import { Btn, Card, Modal, Select } from "@/components/admin/ui";
import { useAdminReviews, type SiteReview } from "@/lib/reviews";

export const Route = createFileRoute("/admin/resenas")({ component: Page });

type SortMode = "client" | "newest" | "oldest" | "highest" | "lowest";
type StatusMode = "all" | "visible" | "hidden";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" style={{ color: "var(--forest)" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={15} fill={n <= rating ? "currentColor" : "transparent"} />
      ))}
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleDateString("es-CR", { year: "numeric", month: "short", day: "numeric" });
}

function sortReviews(items: SiteReview[], sort: SortMode) {
  return [...items].sort((a, b) => {
    if (sort === "client") return clientOrderValue(a) - clientOrderValue(b) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === "highest") return b.rating - a.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === "lowest") return a.rating - b.rating || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function clientOrderValue(review: SiteReview) {
  return review.order > 0 ? review.order : Number.MAX_SAFE_INTEGER;
}

function Page() {
  const { items, loading, error, editReview, removeReview } = useAdminReviews();
  const [sort, setSort] = useState<SortMode>("client");
  const [status, setStatus] = useState<StatusMode>("all");
  const [deleteReview, setDeleteReview] = useState<SiteReview | null>(null);
  const [savingId, setSavingId] = useState("");
  const [actionError, setActionError] = useState("");

  const visibleCount = items.filter((item) => item.visible).length;
  const hiddenCount = items.length - visibleCount;

  const filtered = useMemo(() => {
    const byStatus = items.filter((item) => {
      if (status === "visible") return item.visible;
      if (status === "hidden") return !item.visible;
      return true;
    });
    return sortReviews(byStatus, sort);
  }, [items, sort, status]);

  const clientOrdered = useMemo(() => sortReviews(items.filter((item) => item.visible), "client"), [items]);
  const clientPosition = useMemo(
    () => new Map(clientOrdered.map((item, index) => [item.id, index + 1])),
    [clientOrdered],
  );

  const toggleVisible = async (review: SiteReview) => {
    setSavingId(review.id);
    setActionError("");
    try {
      await editReview({ ...review, visible: !review.visible });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo actualizar la reseña.");
    } finally {
      setSavingId("");
    }
  };

  const moveReview = async (review: SiteReview, direction: -1 | 1) => {
    if (!review.visible) return;
    const normalized = clientOrdered.map((item, index) => ({
      ...item,
      order: item.order > 0 ? item.order : index + 1,
    }));
    const currentIndex = normalized.findIndex((item) => item.id === review.id);
    const target = normalized[currentIndex + direction];

    if (currentIndex < 0 || !target) return;

    const current = normalized[currentIndex];
    setSavingId(review.id);
    setActionError("");
    try {
      await editReview({ ...current, order: target.order });
      await editReview({ ...target, order: current.order });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo cambiar el orden de la reseña.");
    } finally {
      setSavingId("");
    }
  };

  const confirmDelete = async () => {
    if (!deleteReview) return;
    setSavingId(deleteReview.id);
    setActionError("");
    try {
      await removeReview(deleteReview.id);
      setDeleteReview(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo eliminar la reseña.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <div>
      <AdminTitle title="Reseñas" subtitle="Administra las reseñas enviadas desde la página." />

      {(error || actionError) && (
        <p className="mb-4 text-sm font-serif" style={{ color: "var(--destructive)" }}>
          {actionError || error}
        </p>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>Total</p>
          <p className="text-4xl" style={{ color: "var(--coffee)" }}>{items.length}</p>
        </Card>
        <Card className="p-4">
          <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>Visibles</p>
          <p className="text-4xl" style={{ color: "var(--forest)" }}>{visibleCount}</p>
        </Card>
        <Card className="p-4">
          <p className="font-serif text-sm" style={{ color: "var(--muted-foreground)" }}>Ocultas</p>
          <p className="text-4xl" style={{ color: "var(--coffee)" }}>{hiddenCount}</p>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="font-serif" style={{ color: "var(--coffee)" }}>
            Ordenar
            <Select className="mt-1" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
              <option value="client">Orden en la página web</option>
              <option value="newest">Nuevas primero</option>
              <option value="oldest">Antiguas primero</option>
              <option value="highest">Más altas primero</option>
              <option value="lowest">Más bajas primero</option>
            </Select>
          </label>
          <label className="font-serif" style={{ color: "var(--coffee)" }}>
            Estado
            <Select className="mt-1" value={status} onChange={(e) => setStatus(e.target.value as StatusMode)}>
              <option value="all">Todas</option>
              <option value="visible">Solo visibles</option>
              <option value="hidden">Solo ocultas</option>
            </Select>
          </label>
        </div>
      </Card>

      {loading ? (
        <Card>
          <p className="font-serif" style={{ color: "var(--muted-foreground)" }}>Cargando reseñas...</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="font-serif" style={{ color: "var(--muted-foreground)" }}>No hay reseñas con estos filtros.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((review) => (
            <article
              key={review.id}
              className="rounded-lg border p-5 shadow-sm flex flex-col gap-3"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif font-semibold" style={{ color: "var(--coffee)" }}>{review.name}</p>
                  <p className="font-serif text-xs" style={{ color: "var(--muted-foreground)" }}>{formatDate(review.createdAt)}</p>
                  {review.visible && (
                    <p className="font-serif text-xs mt-1" style={{ color: "var(--forest)" }}>
                      Orden en la página web #{clientPosition.get(review.id) ?? "-"}
                    </p>
                  )}
                </div>
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-serif"
                  style={{
                    background: review.visible ? "var(--forest)" : "var(--tan)",
                    color: review.visible ? "var(--cream)" : "var(--coffee)",
                  }}
                >
                  {review.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  {review.visible ? "Visible" : "Oculta"}
                </span>
              </div>

              <Stars rating={review.rating} />
              <p className="font-serif text-sm leading-relaxed flex-1" style={{ color: "var(--coffee)" }}>
                "{review.text}"
              </p>
              {review.email && (
                <p className="font-serif text-xs" style={{ color: "var(--muted-foreground)" }}>{review.email}</p>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {sort === "client" && (
                  <>
                    <Btn
                      type="button"
                      variant="outline"
                      disabled={!review.visible || savingId === review.id || (clientPosition.get(review.id) ?? 1) <= 1}
                      onClick={() => void moveReview(review, -1)}
                      aria-label={`Subir reseña de ${review.name}`}
                      className="px-3"
                    >
                      <ArrowUp size={15} />
                    </Btn>
                    <Btn
                      type="button"
                      variant="outline"
                      disabled={!review.visible || savingId === review.id || (clientPosition.get(review.id) ?? clientOrdered.length) >= clientOrdered.length}
                      onClick={() => void moveReview(review, 1)}
                      aria-label={`Bajar reseña de ${review.name}`}
                      className="px-3"
                    >
                      <ArrowDown size={15} />
                    </Btn>
                  </>
                )}
                <Btn
                  type="button"
                  variant="outline"
                  disabled={savingId === review.id}
                  onClick={() => void toggleVisible(review)}
                  className="flex-1 justify-center min-w-28"
                >
                  {review.visible ? <EyeOff size={15} /> : <Eye size={15} />}
                  {review.visible ? "Ocultar" : "Mostrar"}
                </Btn>
                <Btn
                  type="button"
                  variant="danger"
                  disabled={savingId === review.id}
                  onClick={() => setDeleteReview(review)}
                  aria-label={`Eliminar reseña de ${review.name}`}
                >
                  <Trash2 size={15} />
                </Btn>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={!!deleteReview} onClose={() => setDeleteReview(null)} title="Eliminar reseña">
        {deleteReview && (
          <>
            <p className="font-serif mb-6" style={{ color: "var(--coffee)" }}>
              ¿Seguro que deseas eliminar la reseña de "{deleteReview.name}"? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <Btn variant="outline" onClick={() => setDeleteReview(null)}>Cancelar</Btn>
              <Btn variant="danger" disabled={savingId === deleteReview.id} onClick={confirmDelete}>Eliminar</Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
