import { Check, Globe, X } from "lucide-react";
import { useUi } from "@/store/ui";
import { LANGUAGES, type Language } from "@/types";
import { cn } from "@/lib/utils";

export function LanguageModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const language = useUi((s) => s.language);
  const setLanguage = useUi((s) => s.setLanguage);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#18261F]/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lang-modal-title"
        className="relative z-10 w-full max-w-md rounded-[20px] bg-white p-6 sm:p-8 shadow-[0_16px_40px_rgba(16,26,18,0.14)] border border-[#DCE4DF]"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E3EFE8] text-[#1B3B2B]">
              <Globe className="h-5 w-5" />
            </span>
            <div>
              <h3 id="lang-modal-title" className="font-heading text-lg font-bold text-[#18261F]">
                Select Language / भाषा चुनें
              </h3>
              <p className="text-xs text-[#52635A]">Choose your preferred regional script</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#52635A] hover:bg-[#F1F6F2] hover:text-[#18261F] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Select language">
          {LANGUAGES.map((l) => {
            const active = language === l.code;
            return (
              <button
                key={l.code}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setLanguage(l.code as Language);
                  onClose();
                }}
                className={cn(
                  "flex min-h-[72px] items-center justify-between rounded-2xl border-[1.5px] p-3.5 text-left transition-all",
                  active
                    ? "border-[#1B3B2B] bg-[#E3EFE8]/40 text-[#1B3B2B] shadow-sm ring-1 ring-[#1B3B2B]"
                    : "border-[#DCE4DF] bg-white hover:border-[#1B3B2B]/50 hover:bg-[#F1F6F2]"
                )}
              >
                <div>
                  <span className="block text-base font-bold text-[#18261F]">{l.native}</span>
                  <span className="mt-0.5 block text-xs text-[#52635A]">{l.label}</span>
                </div>
                {active && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1B3B2B] text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#1B3B2B] text-white font-semibold text-sm hover:bg-[#152E21] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

