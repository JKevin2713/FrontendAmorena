import { Check, Loader2, Save } from "lucide-react";
import { Btn } from "@/components/admin/ui";
import type { SaveState } from "./types";

type SaveTranslationButtonProps = {
  state?: SaveState[string];
  onClick: () => void;
};

export function SaveTranslationButton({ state, onClick }: SaveTranslationButtonProps) {
  const saving = state === "saving";
  const success = state === "success";

  return (
    <Btn onClick={onClick} disabled={saving} variant={success ? "outline" : "primary"}>
      {saving ? <Loader2 size={16} className="animate-spin" /> : success ? <Check size={16} /> : <Save size={16} />}
      {saving ? "Guardando..." : success ? "Guardado" : "Guardar"}
    </Btn>
  );
}
