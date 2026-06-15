import { adminApiRequest } from "@/lib/admin-auth";

export type BusinessInfo = {
  name: string;
  nombre: string;
  description: string;
  descripcion: string;
  description_en?: string;
  descripcion_en?: string;
  slogan: string;
  slogan_en?: string;
  phone: string;
  telefono: string;
  email: string;
  correo: string;
  address: string;
  direccion: string;
  address_en?: string;
  direccion_en?: string;
  weekday: string;
  horarioSemana: string;
  weekend: string;
  horarioFinSemana: string;
};

type BusinessInfoPayload = Partial<BusinessInfo>;

export const fallbackBusinessInfo: BusinessInfo = {
  name: "Amorena Coffee & Garden",
  nombre: "Amorena Coffee & Garden",
  description: "Una cafetería jardín en El Tejar, Cartago. Tardes y dulces momentos.",
  descripcion: "Una cafetería jardín en El Tejar, Cartago. Tardes y dulces momentos.",
  slogan: "Tardes y dulces momentos",
  phone: "7297 4011",
  telefono: "7297 4011",
  email: "hola@amorena.com",
  correo: "hola@amorena.com",
  address: "500 metros sur del Autopista El Molino, Provincia de Cartago, El Tejar, 30106",
  direccion: "500 metros sur del Autopista El Molino, Provincia de Cartago, El Tejar, 30106",
  weekday: "8:00 AM - 8:00 PM",
  horarioSemana: "8:00 AM - 8:00 PM",
  weekend: "9:00 AM - 9:00 PM",
  horarioFinSemana: "9:00 AM - 9:00 PM",
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function normalizeBusinessInfo(info: BusinessInfoPayload): BusinessInfo {
  const name = String(info.nombre || info.name || "");
  const description = String(info.descripcion || info.description || "");
  const descriptionEn = String(info.descripcion_en || info.description_en || "");
  const phone = String(info.telefono || info.phone || "");
  const email = String(info.correo || info.email || "");
  const address = String(info.direccion || info.address || "");
  const addressEn = String(info.direccion_en || info.address_en || "");
  const weekday = String(info.horarioSemana || info.weekday || "");
  const weekend = String(info.horarioFinSemana || info.weekend || "");

  return {
    name,
    nombre: name,
    description,
    descripcion: description,
    description_en: descriptionEn,
    descripcion_en: descriptionEn,
    slogan_en: String(info.slogan_en || ""),
    slogan: String(info.slogan || ""),
    phone,
    telefono: phone,
    email,
    correo: email,
    address,
    direccion: address,
    address_en: addressEn,
    direccion_en: addressEn,
    weekday,
    horarioSemana: weekday,
    weekend,
    horarioFinSemana: weekend,
  };
}

export async function getPublicBusinessInfo(): Promise<BusinessInfo> {
  const response = await fetch(`${API_URL}/informacion-negocio/publica`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "No se pudo cargar la información del negocio");
  }
  return normalizeBusinessInfo(data.informacion);
}

export async function getBusinessInfo(): Promise<BusinessInfo> {
  const data = await adminApiRequest<{ informacion: BusinessInfoPayload }>("/informacion-negocio");
  return normalizeBusinessInfo(data.informacion);
}

export async function updateBusinessInfo(info: BusinessInfo): Promise<BusinessInfo> {
  const data = await adminApiRequest<{ informacion: BusinessInfoPayload }>("/informacion-negocio", {
    method: "PUT",
    body: JSON.stringify({
      nombre: info.name,
      descripcion: info.description,
      slogan: info.slogan,
      telefono: info.phone,
      correo: info.email,
      direccion: info.address,
      horarioSemana: info.weekday,
      horarioFinSemana: info.weekend,
    }),
  });
  return normalizeBusinessInfo(data.informacion);
}
