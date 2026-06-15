export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

type ApiError = { message?: string; errors?: string[] };

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as T | ApiError) : undefined;

  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data ? data.message : `Error ${response.status}`;
    const details = typeof data === "object" && data && "errors" in data && Array.isArray(data.errors)
      ? `\n${data.errors.join("\n")}`
      : "";
    throw new Error(`${message || `Error ${response.status}`}${details}`);
  }

  return data as T;
}

// ── Tipos ──────────────────────────────────────────────────────
export type ApiProduct = {
  _id: string;
  nombre: string;
  nombre_en?: string;
  precio: number;
  categoria?: string;
  descripcion?: string;
  descripcion_en?: string;
  imagen?: string;
  descuento?: boolean;
  visible?: boolean;
  cantidadStock?: number;
  filtros?: { _id: string; nombre: string; nombre_en?: string; visible: boolean; descripcion?: string; descripcion_en?: string }[];
  category?: string;
  desc?: string;
  img?: string;
};

export type ApiEvento = {
  _id: string;
  nombre: string;
  nombre_en?: string;
  fecha?: string;
  hora?: string;
  categoria?: string;
  categoria_en?: string;
  descripcion?: string;
  descripcion_en?: string;
  imagen?: string;
  destacado?: boolean;
  visible?: boolean;
};

export type ApiPromocion = {
  _id: string;
  nombre: string;
  nombre_en?: string;
  descripcion?: string;
  descripcion_en?: string;
  descripcion2?: string;
  descripcion2_en?: string;
  link?: string;
  imagen?: string;
  visible?: boolean;
  imgDerecha?: boolean;
  tieneCta?: boolean;
  ctaLabel?: string;
  ctaLabel_en?: string;
};

export type ApiSeccion = {
  slug: string;
  titulo: string;
  titulo_en?: string;
  texto: string;
  texto_en?: string;
  imagen: string;
};

export type ApiMiembro = {
  _id: string;
  nombre: string;
  rol: string;
  rol_en?: string;
  descripcion: string;
  descripcion_en?: string;
  iniciales: string;
  imagen?: string;
};

export type ApiPagina = {
  _id: string;
  slug: string;
  secciones: ApiSeccion[];
  miembros: ApiMiembro[];
};

export type ApiReserva = {
  _id: string;
  nombreCompleto: string;
  correoElectronico: string;
  telefono: string;
  fecha: string;
  hora: string;
  cantidadPersonas: number;
  notas?: string;
  estado: "Pendiente" | "Autorizada" | "Desestimada" | "Cancelada" | "Completada";
  motivoCancelacion?: string;
  createdAt?: string;
};

export type ApiPedidoItem = {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  notas?: string;
};

export type ApiPedido = {
  _id: string;
  nombreCliente: string;
  telefonoCliente: string;
  correoCliente?: string;
  tipoPedido: "Mesa" | "Recoger";
  numeroMesa?: string;
  items: ApiPedidoItem[];
  total: number;
  estado: "Pendiente" | "Preparando" | "Listo" | "Entregado" | "Cancelado";
  tiempoAproximado: number;
  createdAt?: string;
  paymentDetails?: {
    cardType: string;
    last4: string;
  };
};

// ── API ────────────────────────────────────────────────────────
export const api = {
  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("img", file);
    const res = await fetch(`${API_BASE_URL}/product/upload`, {
      method: "POST",
      body: form, // sin Content-Type, fetch lo pone solo con FormData
    });
    if (!res.ok) throw new Error(`Error al subir imagen: ${res.status}`);
    const data = await res.json();
    return data.url as string;
  },
  products: {
    getAll: () => apiRequest<{ products: ApiProduct[] }>("/product"),
    getPublic: () => apiRequest<{ products: ApiProduct[] }>("/product/publicos"),
    getOne: (id: string) => apiRequest<{ product: ApiProduct }>(`/product/${id}`),
    create: (data: Partial<ApiProduct>) => apiRequest<{ product: ApiProduct }>("/product/add", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ApiProduct>) => apiRequest<{ product: ApiProduct }>(`/product/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) => apiRequest<{ message: string }>(`/product/${id}`, { method: "DELETE" }),
  },
  eventos: {
    getAll: () => apiRequest<{ eventos: ApiEvento[] }>("/evento"),
    getOne: (id: string) => apiRequest<{ evento: ApiEvento }>(`/evento/${id}`),
    create: (data: Partial<ApiEvento>) => apiRequest<{ evento: ApiEvento }>("/evento/add", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ApiEvento>) => apiRequest<{ evento: ApiEvento }>(`/evento/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) => apiRequest<{ message: string }>(`/evento/${id}`, { method: "DELETE" }),
  },
  promociones: {
    getAll: () => apiRequest<{ promociones: ApiPromocion[] }>("/promocion"),
    create: (data: Partial<ApiPromocion>) => apiRequest<{ promocion: ApiPromocion }>("/promocion/add", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ApiPromocion>) => apiRequest<{ promocion: ApiPromocion }>(`/promocion/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: string) => apiRequest<{ message: string }>(`/promocion/${id}`, { method: "DELETE" }),
  },
  newsletter: {
    subscribe: (email: string) => apiRequest<{ message: string }>("/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  },
  paginas: {
    get: (slug: string) => apiRequest<{ pagina: ApiPagina }>(`/pagina/${slug}`),
    update: (slug: string, data: Partial<ApiPagina>) => apiRequest<{ pagina: ApiPagina }>(`/pagina/${slug}`, { method: "PUT", body: JSON.stringify(data) }),
    addMiembro: (slug: string, data: Omit<ApiMiembro, "_id">) => apiRequest<{ pagina: ApiPagina }>(`/pagina/${slug}/miembros`, { method: "POST", body: JSON.stringify(data) }),
    updateMiembro: (slug: string, id: string, data: Omit<ApiMiembro, "_id">) => apiRequest<{ pagina: ApiPagina }>(`/pagina/${slug}/miembros/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    removeMiembro: (slug: string, id: string) => apiRequest<{ pagina: ApiPagina }>(`/pagina/${slug}/miembros/${id}`, { method: "DELETE" }),
  },
  reservas: {
    create: (data: Partial<ApiReserva>) => apiRequest<{ message: string; reserva: ApiReserva }>("/reservas", { method: "POST", body: JSON.stringify(data) }),
  },
  pedidos: {
    create: (data: Partial<ApiPedido>) => apiRequest<{ message: string; pedido: ApiPedido }>("/pedidos", { method: "POST", body: JSON.stringify(data) }),
    getAll: () => apiRequest<{ pedidos: ApiPedido[] }>("/pedidos"),
    getOne: (id: string) => apiRequest<{ pedido: ApiPedido }>(`/pedidos/${id}`),
    updateStatus: (id: string, data: { estado?: ApiPedido["estado"]; tiempoAproximado?: number }) => apiRequest<{ message: string; pedido: ApiPedido }>(`/pedidos/${id}/estado`, { method: "PUT", body: JSON.stringify(data) }),
  },
};
