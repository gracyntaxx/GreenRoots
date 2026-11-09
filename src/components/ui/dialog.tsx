import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    variant?: "center" | "sheet" | "wide";
    hideClose?: boolean;
  }
>(({ className, children, variant = "center", hideClose, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[1px] animate-fade-in" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 bg-surface shadow-xl focus:outline-none dark:bg-portal-surface",
        variant === "center" &&
          "left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line p-5 sm:p-6 animate-fade-in dark:border-portal-line",
        variant === "wide" &&
          "left-1/2 top-1/2 max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line p-6 dark:border-portal-line",
        variant === "sheet" &&
          "bottom-0 left-0 right-0 max-h-[92dvh] w-full sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85dvh] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 overflow-y-auto rounded-t-3xl sm:rounded-2xl border-t sm:border border-line px-5 sm:px-6 pb-8 pt-3 sm:py-6 animate-sheet-up sm:animate-fade-in dark:border-portal-line",
        className
      )}
      {...props}
    >
      {variant === "sheet" && (
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line sm:hidden" aria-hidden="true" />
      )}
      {children}
      {!hideClose && (
        <DialogPrimitive.Close
          className="absolute right-3.5 top-3.5 flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-canvas focus-visible:outline-none dark:text-portal-muted dark:hover:bg-portal-bg"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 pr-10", className)} {...props} />;
}

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-xl font-bold leading-tight text-ink dark:text-portal-ink", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("mt-1.5 text-sm text-muted dark:text-portal-muted", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}
