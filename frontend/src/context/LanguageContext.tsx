import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  type Locale,
  type MessageKey,
  messages,
} from "@/i18n/translations";

const STORAGE_KEY = "jal-drishti-locale";

function readStoredLocale(): Locale {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === "en" || s === "hi" || s === "mr") return s;
  } catch {
    /* ignore */
  }
  return "en";
}

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: MessageKey) => messages[locale][key] ?? String(key),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
