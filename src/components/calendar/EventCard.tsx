"use client"

import { motion } from "framer-motion"
import { MapPin, Clock } from "lucide-react"
import { formatTime } from "@/lib/utils/dates"
import { cn } from "@/lib/utils/cn"
import type { EventWithMember } from "@/lib/hooks/useEvents"

interface EventCardProps {
  event: EventWithMember
  compact?: boolean
  isConflict?: boolean
  onClick?: (event: EventWithMember) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  saude: "Saúde",
  lazer: "Lazer",
  escola: "Escola",
  trabalho: "Trabalho",
  outro: "Outro",
}

export function EventCard({ event, compact = false, isConflict = false, onClick }: EventCardProps) {
  const color = event.member?.color ?? "#3D405B"

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick?.(event)}
      className={cn(
        "rounded-ello-sm cursor-pointer transition-all duration-200 hover:shadow-md",
        "border-l-4 px-3 py-2 select-none",
        isConflict ? "border-dashed" : "",
        onClick && "active:scale-[0.98]"
      )}
      style={{
        borderLeftColor: color,
        backgroundColor: `${color}18`,
      }}
    >
      <p className={cn("font-body font-medium text-ello-indigo leading-tight", compact ? "text-xs" : "text-sm")}>
        {event.title}
      </p>

      {!compact && (
        <div className="mt-1 flex flex-wrap gap-2">
          {!event.all_day && (
            <span className="flex items-center gap-1 text-xs text-ello-indigo/60">
              <Clock className="h-3 w-3" />
              {formatTime(event.starts_at)} – {formatTime(event.ends_at)}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-ello-indigo/60">
              <MapPin className="h-3 w-3" />
              {event.location}
            </span>
          )}
        </div>
      )}

      {compact && !event.all_day && (
        <p className="text-[10px] text-ello-indigo/50">{formatTime(event.starts_at)}</p>
      )}

      <div className="mt-1 flex items-center gap-1.5">
        <span
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-[10px] text-ello-indigo/50">{event.member?.display_name}</span>
        {!compact && (
          <span className="text-[10px] text-ello-indigo/30">· {CATEGORY_LABELS[event.category] ?? event.category}</span>
        )}
      </div>
    </motion.div>
  )
}
