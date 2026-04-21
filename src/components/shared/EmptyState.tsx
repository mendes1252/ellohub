import { cn } from "@/lib/utils/cn"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {icon && <div className="mb-4 text-ello-indigo/20">{icon}</div>}
      <h3 className="font-display text-lg text-ello-indigo">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-ello-indigo/60 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
