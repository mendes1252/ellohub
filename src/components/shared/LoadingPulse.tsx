import { cn } from "@/lib/utils/cn"

interface LoadingPulseProps {
  className?: string
  lines?: number
}

export function LoadingPulse({ className, lines = 3 }: LoadingPulseProps) {
  return (
    <div className={cn("space-y-3", className)} aria-label="Carregando..." role="status">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-ello bg-ello-indigo/5 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  )
}
