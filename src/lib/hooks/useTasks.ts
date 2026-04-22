"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import type { Member } from "@/lib/hooks/useFamily"

export interface TaskWithMember {
  id: string
  family_id: string
  list_name: string
  assigned_to: string | null
  created_by: string
  title: string
  notes: string | null
  status: "pending" | "done"
  due_date: string | null
  completed_at: string | null
  position: number
  created_at: string
  member: Member | null
}

export function useTasks(familyId: string | undefined) {
  const [tasks, setTasks] = useState<TaskWithMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserClient()

  const fetchTasks = useCallback(async () => {
    if (!familyId) { setIsLoading(false); return }
    const { data } = await supabase
      .from("tasks")
      .select("*, member:members!tasks_assigned_to_fkey(*)")
      .eq("family_id", familyId)
      .order("list_name")
      .order("position")
    setTasks((data as any) ?? [])
    setIsLoading(false)
  }, [familyId])

  useEffect(() => {
    fetchTasks()
    if (!familyId) return
    const channel = supabase
      .channel(`tasks:${familyId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "tasks",
        filter: `family_id=eq.${familyId}`,
      }, fetchTasks)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [familyId, fetchTasks])

  return { tasks, isLoading, refetch: fetchTasks }
}
