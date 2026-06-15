import { useEffect, useState } from "react";

function read<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; }
}
function write(k: string, v: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent("amorena.store", { detail: k }));
}

export function useStore<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [state, setState] = useState<T>(() => read(key, initial));
  useEffect(() => {
    const sync = (e: Event) => {
      if ((e as CustomEvent).detail === key) setState(read(key, initial));
    };
    window.addEventListener("amorena.store", sync);
    return () => window.removeEventListener("amorena.store", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = (v: T | ((p: T) => T)) => {
    const next = typeof v === "function" ? (v as (p: T) => T)(state) : v;
    setState(next);
    write(key, next);
  };
  return [state, set];
}

export const SEEDS = {
  business: {
    name: "Amorena Coffee & Garden",
    description: "Una cafetería jardín en El Tejar, Cartago. Tardes y dulces momentos.",
    slogan: "Tardes y dulces momentos",
    phone: "+506 2540-0000",
    email: "hola@amorena.com",
    address: "El Tejar, Cartago, Costa Rica",
    weekday: "8:00 AM - 8:00 PM",
    weekend: "9:00 AM - 9:00 PM",
  },
  socials: [
    { id: "1", name: "Instagram", url: "instagram.com/amorena_coffee" },
    { id: "2", name: "Facebook", url: "facebook.com/amorena.coffee" },
  ],
  faqs: [
    { id: "1", q: "¿Dónde están ubicados?", a: "En El Tejar, Cartago. Vea el mapa en la sección Horarios." },
    { id: "2", q: "¿Se puede reservar el lugar para eventos?", a: "Sí, contáctenos por teléfono o correo." },
    { id: "3", q: "¿Tienen descuentos?", a: "Sí, vea la sección Promociones." },
    { id: "4", q: "¿Tienen servicio de envío?", a: "Por el momento solo servicio en el local." },
  ],
  filters: [
    { id: "1", name: "Desayunos", visible: true },
    { id: "2", name: "Bebidas", visible: true },
    { id: "3", name: "Postres", visible: true },
    { id: "4", name: "Almuerzos", visible: true },
  ],
  languages: [
    { id: "1", name: "Español" },
    { id: "2", name: "Inglés" },
  ],
  products: [
    { id: "1", name: "Tostada de Aguacate", price: 4500, category: "Desayunos" },
    { id: "2", name: "Capuchino", price: 2200, category: "Bebidas" },
    { id: "3", name: "Cheesecake de Frutos Rojos", price: 3200, category: "Postres" },
  ],
  events: [
    { id: "1", name: "14 de Febrero con Música Plancha", date: "2026-02-14", description: "Noche romántica con música en vivo." },
  ],
  images: [
    { id: "1", section: "Pantalla Principal", url: "/src/assets/hero-cafe.jpg", alt: "Hero" },
  ],
  promos: [
    { id: "1", name: "Programa de Fidelidad con Puntos Bee", description: "Acumula puntos con cada consumo.", link: "https://beeloyalcard.com/" },
  ],
  reviews: [
    { id: "1", author: "Luis Rojas", text: "Excelente atención.", rating: 5 },
    { id: "2", author: "María Ramírez", text: "Un lugar súper lindo.", rating: 5 },
  ],
  orders: [
    { id: "C47H9", product: "Tostadas de Aguacate", table: "C47H9", status: "Pendiente" as "Pendiente" | "Confirmado" | "Cancelado" },
    { id: "B22F1", product: "Capuchino", table: "B22F1", status: "Pendiente" as "Pendiente" | "Confirmado" | "Cancelado" },
  ],
  schedule: [
    { day: "Lunes", open: "08:00", close: "20:00" },
    { day: "Martes", open: "08:00", close: "20:00" },
    { day: "Miércoles", open: "08:00", close: "20:00" },
    { day: "Jueves", open: "08:00", close: "20:00" },
    { day: "Viernes", open: "08:00", close: "21:00" },
    { day: "Sábado", open: "09:00", close: "21:00" },
    { day: "Domingo", open: "09:00", close: "20:00" },
  ],
  reservations: [
    { id: "R1", date: "2026-10-18", time: "10:00", name: "Andrea S.", people: 2, notes: "Sin notas", status: "Pendiente" as "Pendiente" | "Autorizada" | "Cancelada" },
  ],
};
