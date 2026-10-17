"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import es from "./translations/es.json";
import en from "./translations/en.json";
import pt from "./translations/pt.json";

type Language = "es" | "en" | "pt";

type Translations = typeof es;

const translations: Record<Language, Translations> = { es, en, pt };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return path;
    current = current[key];
  }
  return typeof current === "string" ? current : path;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("es");

  useEffect(() => {
    // 1. Intentar leer de localStorage
    const saved = localStorage.getItem("miestadia_language") as Language;
    if (saved && ["es", "en", "pt"].includes(saved)) {
      setLanguageState(saved);
      return;
    }

    // 2. Detectar idioma del navegador
    const browserLang = navigator.language.split("-")[0];
    if (["es", "en", "pt"].includes(browserLang)) {
      setLanguageState(browserLang as Language);
      return;
    }

    // 3. Default: español
    setLanguageState("es");
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("miestadia_language", lang);
  };

  const t = (key: string): string => {
    return getNestedValue(translations[language], key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslations must be used within a LanguageProvider");
  }
  return context;
}

export type { Language }; 