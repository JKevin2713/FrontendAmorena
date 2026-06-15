import { useEffect, useState } from "react";
import { apiRequest } from "./api";

export type MenuCategory = {
  id: string;
  name: string;
  name_en?: string;
  visible: boolean;
  description: string;
  description_en?: string;
  order: number;
};

type MenuCategoryApi = {
  _id: string;
  nombre: string;
  nombre_en?: string;
  visible: boolean;
  descripcion?: string;
  descripcion_en?: string;
  orden?: number;
};

function mapCategory(item: MenuCategoryApi): MenuCategory {
  return {
    id: item._id,
    name: item.nombre,
    name_en: item.nombre_en ?? "",
    visible: item.visible,
    description: item.descripcion ?? "",
    description_en: item.descripcion_en ?? "",
    order: item.orden ?? 0,
  };
}

function toApiPayload(payload: Omit<MenuCategory, "id">) {
  return {
    nombre: payload.name,
    nombre_en: payload.name_en ?? "",
    visible: payload.visible,
    descripcion: payload.description,
    descripcion_en: payload.description_en ?? "",
    orden: payload.order,
  };
}

export async function fetchMenuCategories() {
  const data = await apiRequest<{ categorias: MenuCategoryApi[] }>("/categorias-menu");
  return data.categorias.map(mapCategory);
}

export async function fetchPublicMenuCategories() {
  const data = await apiRequest<{ categorias: MenuCategoryApi[] }>("/categorias-menu/publicas");
  return data.categorias.map(mapCategory);
}

export async function createMenuCategory(payload: Omit<MenuCategory, "id">) {
  const data = await apiRequest<{ categoria: MenuCategoryApi }>("/categorias-menu", {
    method: "POST",
    body: JSON.stringify(toApiPayload(payload)),
  });
  return mapCategory(data.categoria);
}

export async function updateMenuCategory(payload: MenuCategory) {
  const data = await apiRequest<{ categoria: MenuCategoryApi }>(`/categorias-menu/${payload.id}`, {
    method: "PUT",
    body: JSON.stringify(toApiPayload(payload)),
  });
  return mapCategory(data.categoria);
}

export async function deleteMenuCategory(id: string) {
  await apiRequest(`/categorias-menu/${id}`, { method: "DELETE" });
}

export function useMenuCategories(options: { publicOnly?: boolean } = {}) {
  const [items, setItems] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = options.publicOnly ? await fetchPublicMenuCategories() : await fetchMenuCategories();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las categorías.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = options.publicOnly ? await fetchPublicMenuCategories() : await fetchMenuCategories();
        if (!active) return;
        setItems(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudieron cargar las categorías.");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [options.publicOnly]);

  const addCategory = async (payload: Omit<MenuCategory, "id">) => {
    const created = await createMenuCategory(payload);
    setItems((prev) => [...prev, created].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "es")));
    return created;
  };

  const editCategory = async (payload: MenuCategory) => {
    const updated = await updateMenuCategory(payload);
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "es")));
    return updated;
  };

  const removeCategory = async (id: string) => {
    await deleteMenuCategory(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return { items, loading, error, addCategory, editCategory, removeCategory, refresh: loadCategories };
}
