"use client"

import { useMemo } from "react"
import { isSameDay } from "date-fns"
import { formatTime } from "@/lib/utils/dates"
import { EventCard } from "./EventCard"
import type { EventWithMember } from "@/lib/hooks/useEvents"

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6) // 6h–21h

interface DayViewProps {
  date: Date
  events: EventWithMember[]
  onEventClick: (event: EventWithMember) => void
}

export function DayView({ date, events, onEventClick }: DayViewProps) {
  const dayEvents = useMemo(
    () => events.filter(e => isSameDay(new Date(e.starts_at), date)),
    [events, date]
  )

  const allDayEvents = dayEvents.filter(e => e.all_day)
  const timedEvents = dayEvents.filter(e => !e.all_day)

  function getEventStyle(event: EventWithMember) {
    const start = new Date(event.starts_at)
    const end = new Date(event.ends_at)
    const startMinutes = (start.getHours() - 6) * 60 + start.getMinutes()
    const durationMinutes = (end.getTime() - start.getTime()) / 60000
    const topPct = (startMinutes / (16 * 60)) * 100
    const heightPct = Math.max((durationMinutes / (16 * 60)) * 100, 2.5)
    return { top: `${topPct}%`, height: `${heightPct}%` }
  }

  return (
    <div className="flex flex-col gap-3">
      {allDayEvents.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-ello-indigo/40 font-medium uppercase tracking-wide">Dia todo</p>
          {allDayEvents.map(e => (
            <EventCard key={e.id} event={e} onClick={onEventClick} />
          ))}
        </div>
      )}

      <div className="relative" style={{ height: "640px" }}>
        {/* Grade de horas */}
        {HOURS.map(hour => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-ello-indigo/5 flex items-start"
            style={{ top: `${((hour - 6) / 16) * 100}%` }}
          >
            <span className="text-[10px] text-ello-indigo/30 w-10 pr-2 text-right -mt-2 select-none">
              {hour}h
            </span>
          </div>
        ))}

        {/* Eventos */}
        <div className="absolute left-10 right-0 top-0 bottom-0">
          {timedEvents.map(event => (
            <div
              key={event.id}
              className="absolute left-0 right-1 px-0.5"
              style={getEventStyle(event)}
            >
              <EventCard event={event} compact onClick={onEventClick} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
