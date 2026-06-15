import { useEffect, useState } from "react";
import { adminApiRequest } from "@/lib/admin-auth";
import { apiRequest } from "@/lib/api";

export type SiteReview = {
  id: string;
  name: string;
  email: string;
  rating: number;
  text: string;
  text_en?: string;
  visible: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

type ReviewApi = {
  id?: string;
  _id?: string;
  nombre?: string;
  name?: string;
  correo?: string;
  email?: string;
  calificacion?: number;
  rating?: number;
  comentario?: string;
  comentario_en?: string;
  text?: string;
  text_en?: string;
  visible?: boolean;
  orden?: number;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
};

function mapReview(item: ReviewApi): SiteReview {
  return {
    id: String(item.id || item._id || ""),
    name: String(item.nombre || item.name || ""),
    email: String(item.correo || item.email || ""),
    rating: Number(item.calificacion ?? item.rating ?? 5),
    text: String(item.comentario || item.text || ""),
    text_en: String(item.comentario_en || item.text_en || ""),
    visible: item.visible ?? true,
    order: Number(item.orden ?? item.order ?? 0),
    createdAt: String(item.createdAt || ""),
    updatedAt: String(item.updatedAt || ""),
  };
}

export async function fetchPublicReviews() {
  const data = await apiRequest<{ resenas: ReviewApi[] }>("/resenas/publicas");
  return data.resenas.map(mapReview);
}

export async function createPublicReview(payload: { name: string; email?: string; rating: number; text: string }) {
  const data = await apiRequest<{ resena: ReviewApi }>("/resenas", {
    method: "POST",
    body: JSON.stringify({
      nombre: payload.name,
      correo: payload.email || "",
      calificacion: payload.rating,
      comentario: payload.text,
    }),
  });
  return mapReview(data.resena);
}

export async function fetchAdminReviews() {
  const data = await adminApiRequest<{ resenas: ReviewApi[] }>("/resenas");
  return data.resenas.map(mapReview);
}

export async function updateAdminReview(review: SiteReview) {
  const data = await adminApiRequest<{ resena: ReviewApi }>(`/resenas/${review.id}`, {
    method: "PUT",
    body: JSON.stringify({
      nombre: review.name,
      correo: review.email,
      calificacion: review.rating,
      comentario: review.text,
      visible: review.visible,
      orden: review.order,
    }),
  });
  return mapReview(data.resena);
}

export async function deleteAdminReview(id: string) {
  await adminApiRequest(`/resenas/${id}`, { method: "DELETE" });
}

export function usePublicReviews() {
  const [items, setItems] = useState<SiteReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchPublicReviews()
      .then((reviews) => {
        if (!active) return;
        setItems(reviews);
        setError(null);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "No se pudieron cargar las reseñas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { items, loading, error };
}

export function useAdminReviews() {
  const [items, setItems] = useState<SiteReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const reviews = await fetchAdminReviews();
      setItems(reviews);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las reseñas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const reviews = await fetchAdminReviews();
        if (!active) return;
        setItems(reviews);
        setError(null);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "No se pudieron cargar las reseñas.");
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  const editReview = async (review: SiteReview) => {
    const updated = await updateAdminReview(review);
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    return updated;
  };

  const removeReview = async (id: string) => {
    await deleteAdminReview(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return { items, loading, error, editReview, removeReview, refresh: load };
}
