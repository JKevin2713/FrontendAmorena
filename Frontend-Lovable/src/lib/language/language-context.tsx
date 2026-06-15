import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import defaultEnglish from "./en.json";

export type Language = "es" | "en";
type TranslationMap = Record<string, string>;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback: string) => string;
  translate: (targetLanguage: Language, key: string, fallback: string) => string;
  text: (spanish: string, english?: string | null) => string;
};

const STORAGE_KEY = "amorena.language";
const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "es";
  return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "es";
}

export function normalizeLanguageKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [english, setEnglish] = useState<TranslationMap>(defaultEnglish);

  useEffect(() => {
    let active = true;
    apiRequest<{ translations: TranslationMap }>("/languages/public/en")
      .then((data) => {
        if (active) setEnglish({ ...defaultEnglish, ...data.translations });
      })
      .catch(() => {
        if (active) setEnglish(defaultEnglish);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    const setLanguage = (next: Language) => setLanguageState(next);
    const translate = (targetLanguage: Language, key: string, fallback: string) =>
      targetLanguage === "en" ? english[key] || fallback : fallback;
    return {
      language,
      setLanguage,
      toggleLanguage: () => setLanguageState((current) => (current === "es" ? "en" : "es")),
      t: (key, fallback) => translate(language, key, fallback),
      translate,
      text: (spanish, englishValue) => {
        if (language === "en" && englishValue?.trim()) return englishValue;
        return spanish;
      },
    };
  }, [english, language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage debe usarse dentro de LanguageProvider.");
  }
  return context;
}
