"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"

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
    const supabase = createClient()
    const { start, end } = getRange()

    let query = supabase
      .from("events")
      .select("*, member:members(id, display_name, color)")
      .eq("family_id", familyId)
      .gte("starts_at", start.toISOString())
      .lte("starts_at", end.toISOString())
      .order("starts_at")

    if (memberFilter && memberFilter.length > 0) {
      query = query.in("member_id", memberFilter)
    }

    const { data } = await query
    setEvents((data as any) ?? [])

    // Detectar conflitos do dia atual
    const todayStr = date.toISOString().split("T")[0]
    const { data: conflictData } = await supabase.rpc("detect_conflicts", {
      p_family_id: familyId,
      p_date: todayStr,
    } as any)
    setConflicts((conflictData as any) ?? [])

    setIsLoading(false)
  }, [familyId, getRange, memberFilter])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Realtime subscription
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
