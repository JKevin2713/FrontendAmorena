export type PublicRedSocial = {
  id: string;
  name: string;
  url: string;
};

type PublicRedSocialPayload = {
  id?: string;
  id_red_social?: string;
  name?: string;
  nombre?: string;
  url?: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function normalizeUrl(url: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function normalizeRedSocial(redSocial: PublicRedSocialPayload): PublicRedSocial {
  return {
    id: String(redSocial.id_red_social || redSocial.id || ""),
    name: String(redSocial.nombre || redSocial.name || ""),
    url: normalizeUrl(String(redSocial.url || "")),
  };
}

export async function getPublicRedesSociales(): Promise<PublicRedSocial[]> {
  const response = await fetch(`${API_URL}/redes-sociales/publicas`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "No se pudieron cargar las redes sociales");
  }
  return (data.redesSociales || []).map(normalizeRedSocial).filter((item: PublicRedSocial) => item.url);
}
