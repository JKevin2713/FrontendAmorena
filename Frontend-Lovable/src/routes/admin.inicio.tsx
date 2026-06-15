import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminTitle } from "@/components/admin/AdminLayout";
import { api, ApiPagina } from "@/lib/api";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const Route = createFileRoute("/admin/inicio")({ component: Page });

const DEFAULT_SLUGS = ["hero-1", "hero-2", "hero-3"];

type Slide = { slug: string; imagen: string };

function Page() {
  const [pagina,   setPagina]   = useState<ApiPagina | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [slides,   setSlides]   = useState<Slide[]>(
    DEFAULT_SLUGS.map(slug => ({ slug, imagen: "" }))
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.paginas.get("inicio")
      .then(res => {
        setPagina(res.pagina);
        const fromApi = res.pagina.secciones
          .filter(s => s.slug.startsWith("hero-"))
          .sort((a, b) => a.slug.localeCompare(b.slug));

        // Mínimo 3 slides siempre
        const merged: Slide[] = DEFAULT_SLUGS.map(slug => ({
          slug,
          imagen: fromApi.find(s => s.slug === slug)?.imagen ?? "",
        }));

        // Agregar slides extra si el backend tiene más de 3
        fromApi.filter(s => !DEFAULT_SLUGS.includes(s.slug)).forEach(s => {
          merged.push({ slug: s.slug, imagen: s.imagen });
        });

        setSlides(merged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addSlide = () => {
    const nextIndex = slides.length + 1;
    setSlides(prev => [...prev, { slug: `hero-${nextIndex}`, imagen: "" }]);
  };

  const removeSlide = (index: number) => {
    setSlides(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Renumerar slugs para que sean consecutivos
      return updated.map((s, i) => ({ ...s, slug: `hero-${i + 1}` }));
    });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // Preservar secciones que no son del hero
      const otherSecs = pagina?.secciones.filter(s => !s.slug.startsWith("hero-")) ?? [];
      const secciones = [
        ...otherSecs,
        ...slides.map(s => ({ slug: s.slug, titulo: "", texto: "", imagen: s.imagen })),
      ];
      const res = await api.paginas.update("inicio", { secciones });
      setPagina(res.pagina);
      alert("Carrusel guardado.");
    } catch {
      alert("Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }} className="p-8">
      <AdminTitle title="Imágenes — Inicio" subtitle="Administra las imágenes del carrusel de la página principal." />

      {loading ? (
        <p className="font-serif text-center py-20" style={{ color: "var(--coffee)", opacity: .5 }}>Cargando...</p>
      ) : (
        <div className="space-y-6 max-w-2xl">
          <p className="font-serif text-sm" style={{ color: "var(--coffee)" }}>
            Los primeros 3 slides son fijos. Podés agregar más a partir del slide 4.
          </p>

          {slides.map((s, i) => (
            <div key={s.slug} className="rounded-xl border p-5 space-y-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <div className="flex items-center justify-between">
                <p className="font-serif font-semibold text-sm" style={{ color: "var(--coffee)" }}>
                  Slide {i + 1} {i < 3 && <span className="font-normal opacity-50">(fijo)</span>}
                </p>
                {i >= 3 && (
                  <button
                    onClick={() => removeSlide(i)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-serif text-xs"
                    style={{ background: "var(--tan)", color: "var(--coffee)" }}
                  >
                    <Trash2 size={12} /> Eliminar slide
                  </button>
                )}
              </div>
              {s.imagen && (
                <img src={s.imagen} alt={`Slide ${i + 1}`} className="w-full h-40 object-cover rounded-lg" />
              )}
              <ImageUpload
                value={s.imagen}
                onChange={url => setSlides(prev => prev.map((x, j) => j === i ? { ...x, imagen: url } : x))}
              />
            </div>
          ))}

          {/* Añadir slide */}
          <button
            onClick={addSlide}
            className="flex items-center gap-2 w-full justify-center py-3 rounded-xl font-serif text-sm border-2 border-dashed transition-colors"
            style={{ borderColor: "var(--tan-dark)", color: "var(--coffee)" }}
          >
            <Plus size={16} /> Añadir slide
          </button>

          <button
            onClick={saveAll}
            disabled={saving}
            className="px-5 py-2 rounded-lg font-serif text-sm text-white disabled:opacity-50"
            style={{ background: "var(--forest)" }}
          >
            {saving ? "Guardando..." : "Guardar carrusel"}
          </button>
        </div>
      )}
    </div>
  );
}