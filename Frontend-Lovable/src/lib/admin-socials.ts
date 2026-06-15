import { adminApiRequest } from "@/lib/admin-auth";

export type RedSocial = {
  id: string;
  id_red_social: string;
  name: string;
  nombre: string;
  url: string;
  activo: boolean;
  orden: number;
};

type RedSocialPayload = Partial<RedSocial>;

function normalizeRedSocial(redSocial: RedSocialPayload): RedSocial {
  const id = String(redSocial.id_red_social || redSocial.id || "");
  const name = String(redSocial.nombre || redSocial.name || "");

  return {
    id,
    id_red_social: id,
    name,
    nombre: name,
    url: String(redSocial.url || ""),
    activo: redSocial.activo ?? true,
    orden: Number(redSocial.orden || 0),
  };
}

export async function getRedesSociales(): Promise<RedSocial[]> {
  const data = await adminApiRequest<{ redesSociales: RedSocialPayload[] }>("/redes-sociales");
  return data.redesSociales.map(normalizeRedSocial);
}

export async function createRedSocial(redSocial: { name: string; url: string; activo?: boolean; orden?: number }) {
  const data = await adminApiRequest<{ redSocial: RedSocialPayload }>("/redes-sociales", {
    method: "POST",
    body: JSON.stringify({
      nombre: redSocial.name,
      url: redSocial.url,
      activo: redSocial.activo ?? true,
      orden: redSocial.orden ?? 0,
    }),
  });
  return normalizeRedSocial(data.redSocial);
}

export async function updateRedSocial(redSocial: RedSocial) {
  const data = await adminApiRequest<{ redSocial: RedSocialPayload }>(`/redes-sociales/${redSocial.id_red_social}`, {
    method: "PUT",
    body: JSON.stringify({
      nombre: redSocial.name,
      url: redSocial.url,
      activo: redSocial.activo,
      orden: redSocial.orden,
    }),
  });
  return normalizeRedSocial(data.redSocial);
}

export async function deleteRedSocial(idRedSocial: string) {
  await adminApiRequest(`/redes-sociales/${idRedSocial}`, { method: "DELETE" });
}
