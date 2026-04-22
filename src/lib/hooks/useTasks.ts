"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { fetchTasksForFamily } from "@/lib/actions/tasks"
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

  const fetchTasks = useCallback(async () => {
    if (!familyId) { setIsLoading(false); return }
    try {
      const data = await fetchTasksForFamily(familyId)
      setTasks(data as TaskWithMember[])
    } catch (err) {
      console.error("Erro ao buscar tarefas:", err)
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }, [familyId])

  useEffect(() => {
    fetchTasks()
    if (!familyId) return
    const supabase = createBrowserClient()
    const channel = supabase
      .channel(`tasks:${familyId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "tasks",
        filter: `family_id=eq.${familyId}`,
      }, () => fetchTasks())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [familyId, fetchTasks])

  return { tasks, isLoading, refetch: fetchTasks }
}
