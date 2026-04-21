"use client"

import { useMemo } from "react"
import { isSameDay, isSameMonth, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils/cn"
import type { EventWithMember } from "@/lib/hooks/useEvents"

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

interface MonthViewProps {
  date: Date
  events: EventWithMember[]
  onDayClick: (date: Date) => void
  onEventClick: (event: EventWithMember) => void
}

export function MonthView({ date, events, onDayClick, onEventClick }: MonthViewProps) {
  const today = new Date()

  const days = useMemo(() => {
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 0 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
    })
  }, [date])

  return (
    <div>
      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-ello-indigo/40 uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grade */}
      <div className="grid grid-cols-7 gap-px bg-ello-indigo/5 rounded-ello overflow-hidden">
        {days.map(day => {
          const dayEvents = events.filter(e => isSameDay(new Date(e.starts_at), day))
          const isToday = isSameDay(day, today)
          const isCurrentMonth = isSameMonth(day, date)

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={cn(
                "bg-white p-1.5 min-h-[70px] flex flex-col items-start transition-colors hover:bg-ello-offwhite",
                !isCurrentMonth && "opacity-40"
              )}
            >
              <span className={cn(
                "text-xs h-5 w-5 flex items-center justify-center rounded-full mb-1",
                isToday ? "bg-ello-indigo text-white font-bold" : "text-ello-indigo"
              )}>
                {format(day, "d")}
              </span>

              <div className="flex flex-col gap-px w-full">
                {dayEvents.slice(0, 2).map(e => (
                  <button
                    key={e.id}
                    onClick={ev => { ev.stopPropagation(); onEventClick(e) }}
                    className="flex items-center gap-1 w-full text-left"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: e.member?.color }}
                    />
                    <span className="text-[9px] text-ello-indigo truncate">{e.title}</span>
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <span className="text-[9px] text-ello-turquesa-dark">+{dayEvents.length - 2}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
