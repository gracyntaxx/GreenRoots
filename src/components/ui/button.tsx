import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary: "bg-forest text-white hover:bg-[#116b33] active:bg-[#0d5729]",
        secondary: "bg-meadow text-forest border border-forest/25 hover:bg-[#c9f5d6]",
        outline: "bg-surface text-ink border-[1.5px] border-line hover:bg-canvas",
        ghost: "bg-transparent text-ink hover:bg-canvas",
        danger: "bg-error text-white hover:bg-[#b91c1c]",
        paypal: "bg-escrow text-white hover:bg-[#005ea6]",
        ai: "bg-aitint text-[#4b3f97] border border-ai/25 hover:bg-[#e7e1ff]",
        navy: "bg-navy text-white hover:bg-[#00236a]",
        link: "bg-transparent text-forest underline underline-offset-4 hover:text-[#116b33]",
      },
      size: {
        field: "min-h-14 px-5 text-base rounded-field",
        portal: "h-10 px-4 text-sm rounded-portal",
        sm: "h-9 px-3 text-sm rounded-lg",
        icon: "h-11 w-11 rounded-lg",
        fieldIcon: "h-14 w-14 rounded-field",
        lg: "min-h-16 px-6 text-lg rounded-field",
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
