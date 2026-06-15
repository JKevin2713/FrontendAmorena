import { Download, FileDown, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Language } from "@/lib/language/language-context";
import { useLanguage } from "@/lib/language/language-context";
import type { MenuCategory } from "@/lib/menu-categories";
import { downloadMenuPdf, type MenuPdfOptions, type MenuPdfTextSize } from "@/lib/menu-pdf";
import type { MenuItem } from "@/lib/menu-types";

type MenuPdfControlsProps = {
  items: MenuItem[];
  categories: MenuCategory[];
  disabled?: boolean;
};

const textSizeOptions: Array<{ value: MenuPdfTextSize; labelKey: string; fallback: string }> = [
  { value: "standard", labelKey: "menu.pdf.size.standard", fallback: "Normal" },
  { value: "large", labelKey: "menu.pdf.size.large", fallback: "Grande" },
  { value: "extraLarge", labelKey: "menu.pdf.size.extraLarge", fallback: "Extra grande" },
];

export function MenuPdfControls({ items, categories, disabled = false }: MenuPdfControlsProps) {
  const { language, t, translate } = useLanguage();
  const [open, setOpen] = useState(false);
  const [pdfLanguage, setPdfLanguage] = useState<Language>(language);
  const [textSize, setTextSize] = useState<MenuPdfTextSize>("standard");
  const [generating, setGenerating] = useState(false);

  const categoryNames = useMemo(() => categories.map((category) => category.name), [categories]);
  const downloadableItems = useMemo(
    () => items.filter((item) => categoryNames.includes(item.cat)),
    [categoryNames, items],
  );

  useEffect(() => {
    if (!open) setPdfLanguage(language);
  }, [language, open]);

  const getLabels = (targetLanguage: Language) => ({
    title: translate(targetLanguage, "menu.pdf.title", "Menú actualizado"),
    subtitle: translate(targetLanguage, "menu.pdf.subtitle", "Selección curada para compartir con amigos y familia."),
    generated: translate(targetLanguage, "menu.pdf.generated", "Generado el"),
    allCategories: translate(targetLanguage, "menu.pdf.allCategories", "Todas las categorías"),
    empty: translate(targetLanguage, "menu.pdf.empty", "No hay productos para mostrar con esta configuración."),
  });

  const defaultOptions: MenuPdfOptions = {
    language,
    categoryNames,
    textSize: "standard",
  };

  const downloadDefault = async () => {
    setGenerating(true);
    try {
      await downloadMenuPdf(downloadableItems, categories, defaultOptions, getLabels(defaultOptions.language));
    } finally {
      setGenerating(false);
    }
  };

  const downloadCustom = async () => {
    const customOptions: MenuPdfOptions = {
      language: pdfLanguage,
      categoryNames,
      textSize,
    };
    setGenerating(true);
    try {
      await downloadMenuPdf(downloadableItems, categories, customOptions, getLabels(customOptions.language));
      setOpen(false);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        type="button"
        className="btn-primary justify-center text-sm"
        onClick={downloadDefault}
        disabled={disabled || generating || downloadableItems.length === 0}
      >
        <Download size={14} /> {generating ? t("menu.pdf.generating", "Generando...") : t("menu.download.button", "Descargar menú")}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="btn-outline justify-center text-sm px-4 py-2"
            disabled={disabled || generating || downloadableItems.length === 0}
          >
            <Settings2 size={14} /> {t("menu.pdf.customize", "Personalizar PDF")}
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--card)", color: "var(--coffee)" }}>
          <DialogHeader>
            <DialogTitle className="font-script text-4xl font-normal" style={{ color: "var(--forest)" }}>
              {t("menu.pdf.dialogTitle", "Configura tu menú")}
            </DialogTitle>
            <DialogDescription className="font-serif" style={{ color: "var(--muted-foreground)" }}>
              {t("menu.pdf.dialogDescription", "Elige idioma y tamaño de lectura antes de descargar.")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="grid gap-2 font-serif text-sm">
                <span className="font-semibold">{t("menu.pdf.language", "Idioma")}</span>
                <Select value={pdfLanguage} onValueChange={(value) => setPdfLanguage(value as Language)}>
                  <SelectTrigger style={{ background: "var(--cream)", borderColor: "var(--border)" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">{t("header.languageSpanish", "Español")}</SelectItem>
                    <SelectItem value="en">{t("header.languageEnglish", "Inglés")}</SelectItem>
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-2 font-serif text-sm">
                <span className="font-semibold">{t("menu.pdf.textSize", "Tamaño de texto")}</span>
                <Select value={textSize} onValueChange={(value) => setTextSize(value as MenuPdfTextSize)}>
                  <SelectTrigger style={{ background: "var(--cream)", borderColor: "var(--border)" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {textSizeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey, option.fallback)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              className="btn-primary justify-center"
              disabled={generating || downloadableItems.length === 0}
              onClick={downloadCustom}
            >
              <FileDown size={16} /> {generating ? t("menu.pdf.generating", "Generando...") : t("menu.pdf.downloadCustom", "Descargar PDF")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
