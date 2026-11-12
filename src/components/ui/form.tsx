import * as React from "react";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("mb-1.5 block text-sm font-semibold text-ink dark:text-portal-ink", className)}
    {...props}
  />
));
Label.displayName = "Label";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex min-h-12 w-full rounded-xl border border-line bg-white/90 px-4 py-2.5 text-base text-ink placeholder:text-muted/60 shadow-sm transition-all focus:border-terracotta focus:outline-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-terracotta/15 disabled:bg-canvas",
        "dark:border-portal-line dark:bg-portal-bg dark:text-portal-ink dark:placeholder:text-portal-muted",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-28 w-full rounded-xl border border-line bg-white/90 px-4 py-3 text-base text-ink placeholder:text-muted/60 shadow-sm transition-all focus:border-terracotta focus:outline-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-terracotta/15",
      "dark:border-portal-line dark:bg-portal-bg dark:text-portal-ink dark:placeholder:text-portal-muted",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex min-h-12 w-full appearance-none rounded-xl border border-line bg-white/90 px-4 py-2.5 pr-10 text-base text-ink shadow-sm transition-all focus:border-terracotta focus:outline-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-terracotta/15",
      "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20stroke%3D%22%235c6b60%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m5%208%205%205%205-5%22/%3E%3C/svg%3E')] bg-[right_1rem_center] bg-no-repeat",
      "dark:border-portal-line dark:bg-portal-bg dark:text-portal-ink",
      className
    )}
    {...props}
  />
));
Select.displayName = "Select";

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm font-medium text-error">{children}</p>;
}

export function FieldHint({ children, className }: { children?: React.ReactNode; className?: string }) {
  if (!children) return null;
  return <p className={cn("mt-1.5 text-[13px] text-muted dark:text-portal-muted", className)}>{children}</p>;
}
