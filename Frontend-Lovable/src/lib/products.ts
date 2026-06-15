import { useEffect, useState } from "react";
import { apiRequest } from "./api";
import type { FilterItem } from "./filters";

export type ProductItem = {
  id: string;
  name: string;
  name_en?: string;
  price: number;
  category: string;
  desc: string;
  desc_en?: string;
  img: string;
  filterIds: string[];
  filters: FilterItem[];
  visible: boolean;
  discount: boolean;
};

type ProductApi = {
  _id: string;
  nombre: string;
  nombre_en?: string;
  precio: number;
  categoria?: string;
  descripcion?: string;
  descripcion_en?: string;
  imagen?: string;
  filtros?: Array<
    | string
    | null
    | {
        _id: string;
        nombre: string;
        nombre_en?: string;
        visible: boolean;
        descripcion?: string;
        descripcion_en?: string;
      }
  >;
  visible?: boolean;
  descuento?: boolean;
};

function mapFilter(filter: NonNullable<ProductApi["filtros"]>[number]): FilterItem | null {
  if (!filter) return null;
  if (typeof filter === "string") return null;
  return {
    id: filter._id,
    name: filter.nombre,
    name_en: filter.nombre_en ?? "",
    visible: filter.visible,
    description: filter.descripcion ?? "",
    description_en: filter.descripcion_en ?? "",
  };
}

function mapProduct(item: ProductApi): ProductItem {
  const filters = (item.filtros ?? []).map(mapFilter).filter((filter): filter is FilterItem => !!filter);
  const filterIds = (item.filtros ?? [])
    .map((filter) => (typeof filter === "string" ? filter : filter?._id))
    .filter((id): id is string => !!id);

  return {
    id: item._id,
    name: item.nombre,
    name_en: item.nombre_en ?? "",
    price: item.precio ?? 0,
    category: item.categoria?.trim() || "Sin categoria",
    desc: item.descripcion ?? "",
    desc_en: item.descripcion_en ?? "",
    img: item.imagen ?? "",
    filters,
    filterIds,
    visible: item.visible ?? true,
    discount: item.descuento ?? false,
  };
}

function toApiPayload(payload: Omit<ProductItem, "filters">) {
  return {
    nombre: payload.name,
    precio: payload.price,
    categoria: payload.category,
    descripcion: payload.desc,
    imagen: payload.img,
    filtros: payload.filterIds,
    visible: payload.visible,
    descuento: payload.discount,
  };
}

export async function fetchProducts() {
  const data = await apiRequest<{ products: ProductApi[] }>("/product");
  return data.products.map(mapProduct);
}

export async function fetchProductCategories() {
  const data = await apiRequest<{ categories: string[] }>("/product/categories");
  return data.categories;
}

export async function createProduct(payload: Omit<ProductItem, "id" | "filters">) {
  const data = await apiRequest<{ product: ProductApi }>("/product/add", {
    method: "POST",
    body: JSON.stringify(toApiPayload({ ...payload, id: "" })),
  });
  return mapProduct(data.product);
}

export async function updateProduct(payload: Omit<ProductItem, "filters">) {
  const data = await apiRequest<{ product: ProductApi }>(`/product/${payload.id}`, {
    method: "PUT",
    body: JSON.stringify(toApiPayload(payload)),
  });
  return mapProduct(data.product);
}

export async function deleteProduct(id: string) {
  await apiRequest(`/product/${id}`, { method: "DELETE" });
}

export function useProducts() {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts();
        if (!active) return;
        setItems(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No se pudieron cargar los productos.");
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

  const addProduct = async (payload: Omit<ProductItem, "id" | "filters">) => {
    const created = await createProduct(payload);
    setItems((prev) => [...prev, created]);
    return created;
  };

  const editProduct = async (payload: Omit<ProductItem, "filters">) => {
    const updated = await updateProduct(payload);
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    return updated;
  };

  const removeProduct = async (id: string) => {
    await deleteProduct(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return { items, loading, error, addProduct, editProduct, removeProduct, refresh: loadProducts };
}
