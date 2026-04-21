"use client"

import { useMemo } from "react"
import { isSameDay, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getWeekDays } from "@/lib/utils/dates"
import { EventCard } from "./EventCard"
import { cn } from "@/lib/utils/cn"
import type { EventWithMember } from "@/lib/hooks/useEvents"

interface WeekViewProps {
  date: Date
  events: EventWithMember[]
  onEventClick: (event: EventWithMember) => void
  onDayClick: (date: Date) => void
}

export function WeekView({ date, events, onEventClick, onDayClick }: WeekViewProps) {
  const days = useMemo(() => getWeekDays(date), [date])
  const today = new Date()

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map(day => {
        const dayEvents = events.filter(e => isSameDay(new Date(e.starts_at), day))
        const isToday = isSameDay(day, today)
        const isSelected = isSameDay(day, date)

        return (
          <div key={day.toISOString()} className="flex flex-col gap-1">
            <button
              onClick={() => onDayClick(day)}
              className={cn(
                "flex flex-col items-center py-1.5 rounded-ello-sm transition-colors",
                isSelected && "bg-ello-turquesa/20",
                isToday && "font-bold"
              )}
            >
              <span className="text-[10px] text-ello-indigo/40 uppercase">
                {format(day, "EEE", { locale: ptBR })}
              </span>
              <span className={cn(
                "text-sm mt-0.5 h-7 w-7 flex items-center justify-center rounded-full",
                isToday && "bg-ello-indigo text-white",
                !isToday && "text-ello-indigo"
              )}>
                {format(day, "d")}
              </span>
            </button>

            <div className="flex flex-col gap-1 min-h-[60px]">
              {dayEvents.slice(0, 3).map(e => (
                <EventCard key={e.id} event={e} compact onClick={onEventClick} />
              ))}
              {dayEvents.length > 3 && (
                <button
                  onClick={() => onDayClick(day)}
                  className="text-[10px] text-ello-turquesa-dark text-center"
                >
                  +{dayEvents.length - 3} mais
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
