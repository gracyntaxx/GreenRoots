import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(135deg,#D96B27_0%,#EAB308_100%)] text-[#152E21] font-bold border border-[#B85416]/20 shadow-[0_6px_16px_rgba(217,107,39,0.24)] hover:bg-[linear-gradient(135deg,#C25C1F_0%,#D9A306_100%)] hover:shadow-[0_10px_24px_rgba(217,107,39,0.3)] active:scale-[0.985]",
        secondary: "bg-sage text-moss border border-moss/15 hover:bg-sage-deep active:scale-[0.99]",
        outline: "bg-white/80 text-moss border border-line hover:bg-sage-light hover:border-moss/30 shadow-sm backdrop-blur",
        ghost: "bg-transparent text-moss hover:bg-sage-light hover:text-moss-deep",
        danger: "bg-error text-white hover:bg-[#991B1B]",
        paypal: "bg-navy text-white hover:bg-[#002366] shadow-sm",
        ai: "bg-wheat-soft text-[#8A5300] border border-wheat/40 hover:bg-[#FCE9BE]",
        navy: "bg-moss text-white hover:bg-moss-deep",
        link: "bg-transparent text-moss underline underline-offset-4 decoration-terracotta/50 hover:text-terracotta-dark",
      },
      size: {
        field: "min-h-12 px-5 text-sm rounded-field",
        portal: "h-10 px-4 text-sm rounded-xl",
        sm: "h-9 px-3.5 text-xs font-semibold rounded-lg",
        icon: "h-10 w-10 p-0 rounded-xl flex items-center justify-center",
        fieldIcon: "h-12 w-12 p-0 rounded-field flex items-center justify-center",
        lg: "min-h-14 px-7 text-base rounded-full",
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
