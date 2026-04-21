"use client"

import { forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-ello font-body font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ello-turquesa disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-ello-turquesa text-ello-indigo hover:bg-ello-turquesa-dark shadow-sm",
        primary: "bg-ello-indigo text-white hover:bg-ello-indigo-light shadow-sm",
        secondary: "bg-ello-amarelo text-ello-indigo hover:opacity-90 shadow-sm",
        outline: "border-2 border-ello-indigo/20 bg-transparent text-ello-indigo hover:bg-ello-indigo/5",
        ghost: "bg-transparent text-ello-indigo hover:bg-ello-indigo/5",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        rosa: "bg-ello-rosa text-ello-indigo hover:opacity-90 shadow-sm",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        default: "h-11 px-6 text-base",
        lg: "h-13 px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
