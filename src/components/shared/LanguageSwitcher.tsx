import { Check, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, type Language } from "@/types";
import { useUi } from "@/store/ui";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function LanguageSwitcher({ compact, className }: { compact?: boolean; className?: string }) {
  const { t } = useTranslation();
  const language = useUi((s) => s.language);
  const setLanguage = useUi((s) => s.setLanguage);
  const active = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] font-semibold text-ink hover:bg-canvas dark:border-portal-line dark:bg-portal-surface dark:text-portal-ink dark:hover:bg-portal-bg",
            className
          )}
          aria-label={t("common.language")}
        >
          <Languages className="h-4 w-4" aria-hidden="true" />
          {compact ? active.code.toUpperCase() : active.native}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">{t("common.language")}</p>
        <div className="space-y-1">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code as Language)}
              className={cn(
                "flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium hover:bg-canvas dark:hover:bg-portal-bg",
                language === l.code ? "bg-meadow text-forest" : "text-ink dark:text-portal-ink"
              )}
            >
              <span className="flex flex-col">
                <span className="font-semibold">{l.native}</span>
                <span className="text-[11px] font-normal text-muted dark:text-portal-muted">
                  {l.label}
                  {l.partial ? ` · ${t("me.languageNote")}` : ""}
                </span>
              </span>
              {language === l.code && <Check className="h-4 w-4" aria-hidden="true" />}
            </button>
          ))}
        </div>
        <p className="mt-2 border-t border-line pt-2 text-[11px] text-muted dark:border-portal-line dark:text-portal-muted">
          Punjabi, Telugu and Tamil are partly translated. Other text falls back to English.
        </p>
      </PopoverContent>
    </Popover>
  );
}
