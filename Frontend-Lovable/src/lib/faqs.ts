import { useEffect, useState } from "react";
import { apiRequest } from "./api";

export type Faq = { id: string; q: string; a: string; qEn?: string; aEn?: string };

type FaqApi = { _id: string; pregunta: string; pregunta_en?: string; respuesta: string; respuesta_en?: string };

function mapFaq(entry: FaqApi): Faq {
  return { id: entry._id, q: entry.pregunta, qEn: entry.pregunta_en, a: entry.respuesta, aEn: entry.respuesta_en };
}

export async function fetchFaqs() {
  const data = await apiRequest<{ faqs: FaqApi[] }>("/faqs");
  return data.faqs.map(mapFaq);
}

export async function createFaq(payload: Omit<Faq, "id">) {
  const data = await apiRequest<{ faq: FaqApi }>("/faqs", {
    method: "POST",
    body: JSON.stringify({ pregunta: payload.q, respuesta: payload.a }),
  });
  return mapFaq(data.faq);
}

export async function updateFaq(payload: Faq) {
  const data = await apiRequest<{ faq: FaqApi }>(`/faqs/${payload.id}`, {
    method: "PUT",
    body: JSON.stringify({ pregunta: payload.q, respuesta: payload.a }),
  });
  return mapFaq(data.faq);
}

export async function deleteFaq(id: string) {
  await apiRequest(`/faqs/${id}`, { method: "DELETE" });
}

export function useFaqs() {
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFaqs = async () => {
    setLoading(true);
    try {
      const data = await fetchFaqs();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las preguntas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchFaqs();
        if (!active) return;
        setItems(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudieron cargar las preguntas.");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const addFaq = async (payload: Omit<Faq, "id">) => {
    const created = await createFaq(payload);
    setItems((prev) => [...prev, created]);
    return created;
  };

  const editFaq = async (payload: Faq) => {
    const updated = await updateFaq(payload);
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    return updated;
  };

  const removeFaq = async (id: string) => {
    await deleteFaq(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return { items, loading, error, addFaq, editFaq, removeFaq, refresh: loadFaqs };
}
