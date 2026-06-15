import { useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { Btn } from "@/components/admin/ui";
import { exportLanguageSection, importLanguageSection, type LanguageSection, type TranslationImportSummary } from "@/lib/language/admin";

type TranslationJsonToolsProps = {
  section: LanguageSection;
  month: string;
  onImported: () => void;
  onError: (message: string) => void;
};

function sectionFileName(section: LanguageSection, month: string) {
  const suffix = section === "horarios" ? `-${month}` : "";
  return `amorena-traducciones-${section}${suffix}.json`;
}

function downloadJson(fileName: string, data: unknown) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function summaryText(summary: TranslationImportSummary) {
  const total = Object.values(summary).reduce((sum, value) => sum + Number(value || 0), 0);
  return `${total} grupos actualizados.`;
}

export function TranslationJsonTools({ section, month, onImported, onError }: TranslationJsonToolsProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    setSuccess(null);
    try {
      const data = await exportLanguageSection(section, section === "horarios" ? { month } : {});
      downloadJson(sectionFileName(section, month), data);
      setSuccess("Archivo exportado.");
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo exportar el archivo.");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (file: File | undefined) => {
    if (!file || importing) return;
    setImporting(true);
    setSuccess(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const result = await importLanguageSection(section, payload);
      setSuccess(summaryText(result.summary));
      onImported();
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo importar el archivo.");
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Btn type="button" variant="outline" onClick={handleExport} disabled={exporting || importing}>
        {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        Exportar JSON
      </Btn>
      <Btn type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={exporting || importing}>
        {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        Importar JSON
      </Btn>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => handleImport(event.target.files?.[0])}
      />
      {success && (
        <span className="font-serif text-sm" style={{ color: "var(--forest)" }}>
          {success}
        </span>
      )}
    </div>
  );
}
