import { forwardRef } from "react"
import { cn } from "@/lib/utils/cn"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-ello-indigo">
            {label}
          </label>
        )}
        <input
          id={id}
          className={cn(
            "h-11 w-full rounded-ello-sm border border-ello-indigo/20 bg-white px-4 text-ello-indigo placeholder:text-ello-indigo/40 focus:outline-none focus:ring-2 focus:ring-ello-turquesa transition-all duration-200",
            error && "border-red-400 focus:ring-red-400",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
