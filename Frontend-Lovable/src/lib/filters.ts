import { useEffect, useState } from "react";
import { apiRequest } from "./api";

export type FilterItem = {
  id: string;
  name: string;
  name_en?: string;
  visible: boolean;
  description: string;
  description_en?: string;
};

type FilterApi = {
  _id: string;
  nombre: string;
  nombre_en?: string;
  visible: boolean;
  descripcion: string;
  descripcion_en?: string;
};

function mapFilter(item: FilterApi): FilterItem {
  return {
    id: item._id,
    name: item.nombre,
    name_en: item.nombre_en ?? "",
    visible: item.visible,
    description: item.descripcion ?? "",
    description_en: item.descripcion_en ?? "",
  };
}

export async function fetchFilters() {
  const data = await apiRequest<{ filtros: FilterApi[] }>("/filtros");
  return data.filtros.map(mapFilter);
}

export async function createFilter(payload: Omit<FilterItem, "id">) {
  const data = await apiRequest<{ filtro: FilterApi }>("/filtros", {
    method: "POST",
    body: JSON.stringify({
      nombre: payload.name,
      visible: payload.visible,
      descripcion: payload.description,
    }),
  });
  return mapFilter(data.filtro);
}

export async function updateFilter(payload: FilterItem) {
  const data = await apiRequest<{ filtro: FilterApi }>(`/filtros/${payload.id}`, {
    method: "PUT",
    body: JSON.stringify({
      nombre: payload.name,
      visible: payload.visible,
      descripcion: payload.description,
    }),
  });
  return mapFilter(data.filtro);
}

export async function deleteFilter(id: string) {
  await apiRequest(`/filtros/${id}`, { method: "DELETE" });
}

export function useFilters() {
  const [items, setItems] = useState<FilterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchFilters();
        if (!active) return;
        setItems(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudieron cargar los filtros.");
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

  const addFilter = async (payload: Omit<FilterItem, "id">) => {
    const created = await createFilter(payload);
    setItems((prev) => [...prev, created]);
    return created;
  };

  const editFilter = async (payload: FilterItem) => {
    const updated = await updateFilter(payload);
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    return updated;
  };

  const removeFilter = async (id: string) => {
    await deleteFilter(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return { items, loading, error, addFilter, editFilter, removeFilter };
}
