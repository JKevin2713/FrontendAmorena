import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  value?: string;
  onChange: (url: string) => void;
}

export function ImageUpload({ value, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await api.uploadImage(file);
      onChange(url);
    } catch {
      alert("Error al subir la imagen.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <p className="font-serif text-xs uppercase font-semibold mb-2" style={{ color: "var(--coffee)", opacity: 0.6 }}>
        Archivos adjuntos / Imágenes ⓘ
      </p>
      <div className="flex gap-4 items-start">
        {value && <img src={value} alt="Vista previa" className="w-24 h-24 object-cover rounded-lg shrink-0" />}
        <div
          className="flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center py-6 cursor-pointer transition-colors"
          style={{ borderColor: "var(--tan-dark)", background: uploading ? "var(--tan)" : "var(--card)" }}
          onClick={() => !uploading && ref.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && !uploading) handleFile(f); }}
        >
          <Upload size={28} style={{ color: "var(--forest)" }} className="mb-2" />
          <p className="font-serif text-sm font-semibold" style={{ color: "var(--forest)" }}>
            {uploading ? "Subiendo imagen..." : "Arrastra tus archivos aquí"}
          </p>
          <p className="font-serif text-xs mt-1" style={{ color: "var(--coffee)", opacity: 0.6 }}>
            {uploading ? "Por favor espera" : "o haz clic para explorar en tu computadora"}
          </p>
          <input ref={ref} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      </div>
    </div>
  );
}