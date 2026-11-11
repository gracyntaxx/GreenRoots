import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary: "bg-forest text-white hover:bg-[#0A3A24] active:scale-[0.99] shadow-sm",
        secondary: "bg-meadow text-forest border border-forest/20 hover:bg-meadow/80 active:scale-[0.99]",
        outline: "bg-surface text-ink border border-line hover:bg-canvas hover:text-forest shadow-sm",
        ghost: "bg-transparent text-ink hover:bg-canvas hover:text-forest",
        danger: "bg-error text-white hover:bg-[#b91c1c]",
        paypal: "bg-escrow text-white hover:bg-[#005ea6] shadow-sm",
        ai: "bg-aitint text-[#4b3f97] border border-ai/25 hover:bg-[#e7e1ff]",
        navy: "bg-navy text-white hover:bg-[#0E4D2F]",
        link: "bg-transparent text-forest underline underline-offset-4 hover:text-[#0A3A24]",
      },
      size: {
        field: "min-h-12 px-5 text-sm rounded-xl",
        portal: "h-10 px-4 text-sm rounded-lg",
        sm: "h-9 px-3.5 text-xs font-semibold rounded-lg",
        icon: "h-10 w-10 p-0 rounded-lg flex items-center justify-center",
        fieldIcon: "h-12 w-12 p-0 rounded-xl flex items-center justify-center",
        lg: "min-h-14 px-7 text-base rounded-2xl",
        pill: "min-h-12 px-7 text-sm rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "field" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";

export { buttonVariants };
