import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Facebook, Instagram, Linkedin, Mail, MapPin, Music2, Phone, Video } from "lucide-react";
import { fallbackBusinessInfo, getPublicBusinessInfo, type BusinessInfo } from "@/lib/business-info";
import { useLanguage } from "@/lib/language/language-context";
import { getPublicRedesSociales, type PublicRedSocial } from "@/lib/public-socials";
import { Logo } from "./Logo";

const fallbackSocials: PublicRedSocial[] = [
  { id: "instagram", name: "Instagram", url: "https://instagram.com/amorena_coffee" },
  { id: "facebook", name: "Facebook", url: "https://facebook.com/amorena.coffee" },
];

function SocialIcon({ name, url = "", size = 18 }: { name: string; url?: string; size?: number }) {
  const lower = `${name} ${url}`.toLowerCase();
  if (lower.includes("instagram")) return <Instagram size={size} />;
  if (lower.includes("facebook") || lower.includes("fb.com")) return <Facebook size={size} />;
  if (lower.includes("tiktok")) return <Music2 size={size} />;
  if (lower.includes("youtube") || lower.includes("youtu.be")) return <Video size={size} />;
  if (lower.includes("linkedin")) return <Linkedin size={size} />;
  if (lower.includes("whatsapp") || lower.includes("wa.me")) return <Phone size={size} />;
  if (lower.includes("correo") || lower.includes("email") || lower.includes("mail")) return <Mail size={size} />;
  return <ExternalLink size={size} />;
}

function displaySocialUrl(url: string) {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function Footer() {
  const { t, text } = useLanguage();
  const [socials, setSocials] = useState<PublicRedSocial[]>(fallbackSocials);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(fallbackBusinessInfo);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([getPublicRedesSociales(), getPublicBusinessInfo()])
      .then((items) => {
        if (!alive) return;
        const [socialResult, businessResult] = items;
        if (socialResult.status === "fulfilled" && socialResult.value.length > 0) setSocials(socialResult.value);
        if (businessResult.status === "fulfilled") setBusinessInfo(businessResult.value);
      })
      .catch(() => {
        if (!alive) return;
        setSocials(fallbackSocials);
        setBusinessInfo(fallbackBusinessInfo);
      });
    return () => {
      alive = false;
    };
  }, []);

  const instagram = useMemo(
    () => socials.find((social) => {
      const value = `${social.name} ${social.url}`.toLowerCase();
      return value.includes("instagram");
    }),
    [socials],
  );

  return (
    <footer style={{ background: "var(--tan)", color: "var(--coffee)" }}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-12 grid md:grid-cols-3 gap-10">
        <div>
          <Logo tone="brown" className="h-16" />
          <div className="flex gap-3 mt-5">
            {socials.map((social) => (
              <a
                key={social.id || social.url}
                href={social.url}
                aria-label={social.name}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-[var(--cream)]/40 hover:bg-[var(--cream)] transition"
              >
                <SocialIcon name={social.name} url={social.url} />
              </a>
            ))}
          </div>
          <p className="font-serif text-xs mt-6 opacity-80">
            {t("footer.copyright", "Copyright © 2026 Amorena Coffee & Garden - Todos los derechos reservados.")}
          </p>
        </div>
        <div>
          <h3 className="font-script text-3xl mb-3" style={{ color: "var(--forest)" }}>{t("footer.location", "Ubicación")}</h3>
          <p className="font-serif leading-relaxed flex gap-2">
            <MapPin size={17} className="mt-1 shrink-0" />
            <span>{text(businessInfo.address, businessInfo.address_en)}</span>
          </p>
        </div>
        <div>
          <h3 className="font-script text-3xl mb-3" style={{ color: "var(--forest)" }}>{t("footer.contact", "Contacto")}</h3>
          <ul className="font-serif space-y-2">
            {businessInfo.phone && <li className="flex items-center gap-2"><Phone size={16} /> {businessInfo.phone}</li>}
            {instagram && (
              <li className="flex items-center gap-2">
                <SocialIcon name={instagram.name} url={instagram.url} size={16} />
                <a href={instagram.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {displaySocialUrl(instagram.url)}
                </a>
              </li>
            )}
            {businessInfo.email && (
              <li className="flex items-center gap-2">
                <Mail size={16} />
                <a href={`mailto:${businessInfo.email}`} className="hover:underline">{businessInfo.email}</a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
}
