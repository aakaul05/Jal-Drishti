import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/i18n/translations";

const locales: { id: Locale; labelKey: "langEnglish" | "langHindi" | "langMarathi" }[] = [
  { id: "en", labelKey: "langEnglish" },
  { id: "hi", labelKey: "langHindi" },
  { id: "mr", labelKey: "langMarathi" },
];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="glass rounded-xl px-3 py-2 flex items-center gap-2 flex-wrap">
      <Languages className="h-4 w-4 text-cyan-glow shrink-0" aria-hidden />
      <span className="text-xs text-muted-foreground mr-1">{t("languageLabel")}</span>
      <div className="flex gap-1.5 flex-1 justify-end min-w-0">
        {locales.map(({ id, labelKey }) => (
          <Button
            key={id}
            type="button"
            variant={locale === id ? "default" : "outline"}
            size="sm"
            className="text-xs h-8 px-2.5"
            onClick={() => setLocale(id)}
          >
            {t(labelKey)}
          </Button>
        ))}
      </div>
    </div>
  );
}
