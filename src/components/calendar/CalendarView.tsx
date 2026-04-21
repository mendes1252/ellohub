"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from "date-fns"
import { DayView } from "./DayView"
import { WeekView } from "./WeekView"
import { MonthView } from "./MonthView"
import { EventForm } from "./EventForm"
import { ConflictOverlay } from "./ConflictOverlay"
import { MemberAvatar } from "@/components/family/MemberAvatar"
import { LoadingPulse } from "@/components/shared/LoadingPulse"
import { cn } from "@/lib/utils/cn"
import { formatDayHeader, formatMonthYear } from "@/lib/utils/dates"
import { useEvents, type EventWithMember } from "@/lib/hooks/useEvents"
import type { Member, Family } from "@/lib/hooks/useFamily"
import { format } from "date-fns"

type CalendarView = "day" | "week" | "month"

interface CalendarViewProps {
  family: Family
  members: Member[]
  currentMember: Member
}

export function CalendarView({ family, members, currentMember }: CalendarViewProps) {
  const [view, setView] = useState<CalendarView>("week")
  const [date, setDate] = useState(new Date())
  const [memberFilter, setMemberFilter] = useState<string[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventWithMember | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formDate, setFormDate] = useState<Date | undefined>()

  const { events, conflicts, isLoading, refetch } = useEvents(
    family.id,
    date,
    view,
    memberFilter.length > 0 ? memberFilter : undefined
  )

  function navigate(dir: 1 | -1) {
    if (view === "day") setDate(d => dir === 1 ? addDays(d, 1) : subDays(d, 1))
    else if (view === "week") setDate(d => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1))
    else setDate(d => dir === 1 ? addMonths(d, 1) : subMonths(d, 1))
  }

  function getDateLabel() {
    if (view === "day") return formatDayHeader(date)
    if (view === "week") return `Semana de ${format(date, "d MMM")}`
    return formatMonthYear(date)
  }

  function toggleMemberFilter(memberId: string) {
    setMemberFilter(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    )
  }

  function handleEventClick(event: EventWithMember) {
    setSelectedEvent(event)
    setShowForm(true)
  }

  function handleDayClick(d: Date) {
    setDate(d)
    setView("day")
  }

  function handleNewEvent(d?: Date) {
    setSelectedEvent(null)
    setFormDate(d)
    setShowForm(true)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header de navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-ello-indigo/5 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5 text-ello-indigo" />
          </button>
          <h2 className="font-display text-base text-ello-indigo min-w-[120px] text-center capitalize">
            {getDateLabel()}
          </h2>
          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-full hover:bg-ello-indigo/5 transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight className="h-5 w-5 text-ello-indigo" />
          </button>
        </div>

        {/* Toggle de view */}
        <div className="flex bg-ello-indigo/5 rounded-ello-sm p-0.5">
          {(["day", "week", "month"] as CalendarView[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-1 rounded-ello-sm text-xs font-medium transition-all",
                view === v ? "bg-white text-ello-indigo shadow-sm" : "text-ello-indigo/50"
              )}
            >
              {v === "day" ? "Dia" : v === "week" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro por membro */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {members.map(m => {
          const active = memberFilter.length === 0 || memberFilter.includes(m.id)
          return (
            <button
              key={m.id}
              onClick={() => toggleMemberFilter(m.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all whitespace-nowrap flex-shrink-0",
                active ? "border-current" : "border-transparent opacity-40"
              )}
              style={{ borderColor: active ? m.color : "transparent", color: m.color }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: m.color }}
              />
              <span className="text-xs font-medium text-ello-indigo">{m.display_name}</span>
            </button>
          )
        })}
      </div>

      {/* Alertas de conflito */}
      <ConflictOverlay conflicts={conflicts} members={members} />

      {/* View do calendário */}
      {isLoading ? (
        <LoadingPulse lines={4} />
      ) : (
        <>
          {view === "day" && (
            <DayView date={date} events={events} onEventClick={handleEventClick} />
          )}
          {view === "week" && (
            <WeekView date={date} events={events} onEventClick={handleEventClick} onDayClick={handleDayClick} />
          )}
          {view === "month" && (
            <MonthView date={date} events={events} onDayClick={handleDayClick} onEventClick={handleEventClick} />
          )}
        </>
      )}

      {/* FAB */}
      <button
        onClick={() => handleNewEvent()}
        className="fixed bottom-20 right-5 h-14 w-14 rounded-full bg-ello-turquesa shadow-lg flex items-center justify-center text-ello-indigo hover:bg-ello-turquesa-dark transition-all active:scale-95 z-20"
        aria-label="Novo evento"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* Formulário de evento */}
      <EventForm
        open={showForm}
        onClose={() => { setShowForm(false); setSelectedEvent(null) }}
        familyId={family.id}
        members={members}
        currentMemberId={currentMember.id}
        event={selectedEvent}
        defaultDate={formDate}
        onSaved={refetch}
      />
    </div>
  )
}
