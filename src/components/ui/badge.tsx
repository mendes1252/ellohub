import { cn } from "@/lib/utils/cn"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive"
}

const variantClasses = {
  default: "bg-ello-turquesa/20 text-ello-indigo",
  secondary: "bg-ello-indigo/10 text-ello-indigo",
  success: "bg-green-100 text-green-700",
  warning: "bg-ello-amarelo/30 text-ello-indigo",
  destructive: "bg-red-100 text-red-600",
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}
