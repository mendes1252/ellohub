"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { fetchEventsForFamily, fetchConflicts } from "@/lib/actions/events"

export interface EventWithMember {
  id: string
  family_id: string
  member_id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  all_day: boolean
  category: string
  location: string | null
  synced_from: string | null
  member: {
    id: string
    display_name: string
    color: string
  }
}

export interface Conflict {
  event_a_id: string
  event_a_title: string
  event_a_member: string
  event_b_id: string
  event_b_title: string
  event_b_member: string
  overlap_start: string
  overlap_end: string
}

type CalendarView = "day" | "week" | "month"

export function useEvents(familyId: string | null, date: Date, view: CalendarView, memberFilter?: string[]) {
  const [events, setEvents] = useState<EventWithMember[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const getRange = useCallback(() => {
    if (view === "day") return { start: startOfDay(date), end: endOfDay(date) }
    if (view === "week") return { start: startOfWeek(date, { weekStartsOn: 0 }), end: endOfWeek(date, { weekStartsOn: 0 }) }
    return { start: startOfMonth(date), end: endOfMonth(date) }
  }, [date, view])

  const fetchEvents = useCallback(async () => {
    if (!familyId) { setIsLoading(false); return }
    setIsLoading(true)
    try {
      const { start, end } = getRange()
      const data = await fetchEventsForFamily(
        familyId,
        start.toISOString(),
        end.toISOString(),
        memberFilter?.length ? memberFilter : undefined
      )
      setEvents(data as EventWithMember[])

      try {
        const todayStr = date.toISOString().split("T")[0]
        const conflictData = await fetchConflicts(familyId, todayStr)
        setConflicts(conflictData)
      } catch {
        // conflicts non-fatal
      }
    } catch (err) {
      console.error("Erro ao buscar eventos:", err)
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }, [familyId, getRange, memberFilter, date])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Realtime subscription — listen for changes then re-fetch via server action
  useEffect(() => {
    if (!familyId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`events:${familyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "events", filter: `family_id=eq.${familyId}` },
        () => fetchEvents()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [familyId, fetchEvents])

  return { events, conflicts, isLoading, refetch: fetchEvents }
}
