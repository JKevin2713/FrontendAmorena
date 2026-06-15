import { apiRequest } from "@/lib/api";

export type LanguageSection =
  | "faqs"
  | "horarios"
  | "menu"
  | "promociones"
  | "eventos"
  | "resenas"
  | "home"
  | "footer"
  | "conozcanos"
  | "reservas"
  | "pedidos";

export type StaticTranslationItem = {
  key: string;
  original: string;
  en: string;
};

export type LanguageFaq = {
  _id: string;
  pregunta: string;
  pregunta_en?: string;
  respuesta: string;
  respuesta_en?: string;
};

export type LanguageRegularSchedule = {
  _id: string;
  dia: string;
  dia_en?: string;
  hora_apertura: string;
  hora_cierre: string;
};

export type LanguageScheduleException = {
  _id: string;
  fecha: string;
  tipo: "cambio" | "cierre" | "cerrar_reservas";
  motivo: string;
  motivo_en?: string;
  hora_apertura?: string;
  hora_cierre?: string;
};

export type LanguagePromotion = {
  _id: string;
  nombre: string;
  nombre_en?: string;
  descripcion?: string;
  descripcion_en?: string;
  descripcion2?: string;
  descripcion2_en?: string;
  ctaLabel?: string;
  ctaLabel_en?: string;
};

export type LanguageEvent = {
  _id: string;
  nombre: string;
  nombre_en?: string;
  categoria?: string;
  categoria_en?: string;
  descripcion?: string;
  descripcion_en?: string;
  fecha?: string;
  hora?: string;
};

export type LanguageReview = {
  _id?: string;
  id?: string;
  nombre?: string;
  name?: string;
  comentario?: string;
  comentario_en?: string;
  text?: string;
  text_en?: string;
};

export type LanguageBusinessInfo = {
  _id: string;
  descripcion?: string;
  descripcion_en?: string;
  slogan?: string;
  slogan_en?: string;
  direccion?: string;
  direccion_en?: string;
};

export type LanguageMenuProduct = {
  _id: string;
  nombre: string;
  nombre_en?: string;
  descripcion?: string;
  descripcion_en?: string;
  categoria?: string;
  precio?: number;
};

export type LanguageMenuCategory = {
  _id: string;
  nombre: string;
  nombre_en?: string;
  descripcion?: string;
  descripcion_en?: string;
  orden?: number;
};

export type LanguageMenuFilter = {
  _id: string;
  nombre: string;
  nombre_en?: string;
  descripcion?: string;
  descripcion_en?: string;
};

export type LanguagePageSection = {
  slug: string;
  titulo?: string;
  titulo_en?: string;
  texto?: string;
  texto_en?: string;
  imagen?: string;
};

export type LanguagePageMember = {
  _id: string;
  nombre: string;
  rol?: string;
  rol_en?: string;
  descripcion?: string;
  descripcion_en?: string;
  iniciales?: string;
  imagen?: string;
};

export type LanguageSectionData = {
  section: LanguageSection;
  staticText: StaticTranslationItem[];
  faqs?: LanguageFaq[];
  regularSchedule?: LanguageRegularSchedule[];
  exceptions?: LanguageScheduleException[];
  promociones?: LanguagePromotion[];
  eventos?: LanguageEvent[];
  resenas?: LanguageReview[];
  businessInfo?: LanguageBusinessInfo;
  products?: LanguageMenuProduct[];
  menuCategories?: LanguageMenuCategory[];
  filters?: LanguageMenuFilter[];
  pageSections?: LanguagePageSection[];
  pageMembers?: LanguagePageMember[];
};

export type TranslationExportPackage = {
  version?: number;
  idioma_destino?: "en" | string;
  seccion?: LanguageSection;
  texto_estatico?: Array<{
    clave: string;
    original?: string;
    traduccion?: string;
  }>;
  preguntas?: Array<{
    id: string;
    pregunta?: { original?: string; traduccion?: string };
    respuesta?: { original?: string; traduccion?: string };
  }>;
  mes_excepciones?: string;
  horario_regular?: Array<{
    id: string;
    dia?: { original?: string; traduccion?: string };
    hora_apertura?: string;
    hora_cierre?: string;
  }>;
  excepciones?: Array<{
    id: string;
    fecha?: string;
    tipo?: "cambio" | "cierre" | "cerrar_reservas";
    motivo?: { original?: string; traduccion?: string };
    hora_apertura?: string;
    hora_cierre?: string;
  }>;
  promociones?: Array<Record<string, unknown>>;
  eventos?: Array<Record<string, unknown>>;
  resenas?: Array<Record<string, unknown>>;
  informacion_negocio?: Array<Record<string, unknown>>;
  productos?: Array<Record<string, unknown>>;
  categorias_menu?: Array<Record<string, unknown>>;
  filtros?: Array<Record<string, unknown>>;
  secciones_inicio?: Array<Record<string, unknown>>;
  secciones?: Array<Record<string, unknown>>;
  miembros?: Array<Record<string, unknown>>;
};

export type TranslationImportSummary = {
  staticText: number;
  faqs: number;
  regularSchedule: number;
  exceptions: number;
  promotions: number;
  events: number;
  reviews: number;
  businessInfo: number;
  products: number;
  menuCategories: number;
  filters: number;
  homeSections: number;
  aboutSections: number;
  aboutMembers: number;
};

export async function fetchLanguageSection(section: LanguageSection, options: { month?: string } = {}) {
  const params = new URLSearchParams();
  if (options.month) params.set("month", options.month);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<LanguageSectionData>(`/languages/sections/${section}${suffix}`);
}

export async function exportLanguageSection(section: LanguageSection, options: { month?: string } = {}) {
  const params = new URLSearchParams();
  if (options.month) params.set("month", options.month);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<TranslationExportPackage>(`/languages/sections/${section}/export${suffix}`);
}

export async function importLanguageSection(section: LanguageSection, payload: TranslationExportPackage) {
  return apiRequest<{ message: string; summary: TranslationImportSummary }>(`/languages/sections/${section}/import`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateStaticTranslation(section: LanguageSection, key: string, value: string) {
  return apiRequest<{ key: string; en: string }>(`/languages/sections/${section}/static`, {
    method: "PUT",
    body: JSON.stringify({ key, value }),
  });
}

export async function updateFaqTranslation(id: string, payload: { pregunta_en: string; respuesta_en: string }) {
  return apiRequest<{ faq: LanguageFaq }>(`/languages/faqs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateRegularScheduleTranslation(id: string, payload: { dia_en: string }) {
  return apiRequest<{ horario: LanguageRegularSchedule }>(`/languages/horarios/regular/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateScheduleExceptionTranslation(id: string, payload: { motivo_en: string }) {
  return apiRequest<{ excepcion: LanguageScheduleException }>(`/languages/horarios/excepciones/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updatePromotionTranslation(id: string, payload: {
  nombre_en: string;
  descripcion_en: string;
  descripcion2_en: string;
  ctaLabel_en: string;
}) {
  return apiRequest<{ promocion: LanguagePromotion }>(`/languages/promociones/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateEventTranslation(id: string, payload: {
  nombre_en: string;
  categoria_en: string;
  descripcion_en: string;
}) {
  return apiRequest<{ evento: LanguageEvent }>(`/languages/eventos/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateReviewTranslation(id: string, payload: { comentario_en: string }) {
  return apiRequest<{ resena: LanguageReview }>(`/languages/resenas/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateBusinessInfoTranslation(section: "home" | "footer", payload: Partial<{
  descripcion_en: string;
  slogan_en: string;
  direccion_en: string;
}>) {
  return apiRequest<{ businessInfo: LanguageBusinessInfo }>(`/languages/business-info/${section}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateMenuProductTranslation(id: string, payload: { nombre_en: string; descripcion_en: string }) {
  return apiRequest<{ product: LanguageMenuProduct }>(`/languages/menu/productos/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateMenuCategoryTranslation(id: string, payload: { nombre_en: string; descripcion_en: string }) {
  return apiRequest<{ category: LanguageMenuCategory }>(`/languages/menu/categorias/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateMenuFilterTranslation(id: string, payload: { nombre_en: string; descripcion_en: string }) {
  return apiRequest<{ filter: LanguageMenuFilter }>(`/languages/menu/filtros/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updatePageSectionTranslation(section: Extract<LanguageSection, "home" | "conozcanos">, slug: string, payload: {
  titulo_en: string;
  texto_en: string;
}) {
  return apiRequest<{ pageSection: LanguagePageSection }>(`/languages/paginas/${section}/secciones/${slug}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updatePageMemberTranslation(section: "conozcanos", id: string, payload: {
  rol_en: string;
  descripcion_en: string;
}) {
  return apiRequest<{ pageMember: LanguagePageMember }>(`/languages/paginas/${section}/miembros/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
