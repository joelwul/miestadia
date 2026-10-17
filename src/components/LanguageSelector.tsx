"use client";
import { useTranslations, Language } from "@/lib/i18n/LanguageContext";
import { Globe, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface LanguageSelectorProps {
  variant?: "dropdown" | "inline";
  className?: string;
}

const LANGUAGES: { code: Language; flag: string; label: string }[] = [
  { code: "es", flag: "🇦", label: "Español" },
  { code: "en", flag: "🇺🇸", label: "English" },
  { code: "pt", flag: "🇧🇷", label: "Português" },
];

export default function LanguageSelector({ variant = "dropdown", className = "" }: LanguageSelectorProps) {
  const { language, setLanguage } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
              language === lang.code
                ? "bg-green-600 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
            title={lang.label}
          >
            <span className="mr-1">{lang.flag}</span>
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white rounded-lg transition-colors border border-white/20 text-sm font-medium"
      >
        <Globe className="w-4 h-4" />
        <span className="text-lg">{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                language === lang.code ? "bg-green-50 text-green-700" : "text-gray-700"
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="font-medium">{lang.label}</span>
              {language === lang.code && (
                <span className="ml-auto text-green-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}