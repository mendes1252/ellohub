"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  read_at: string | null
  created_at: string
}

export function useNotifications(memberId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (!memberId) return
    const supabase = createClient()
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, message, read_at, created_at")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false })
      .limit(20)
    const list = (data as Notification[]) ?? []
    setNotifications(list)
    setUnreadCount(list.filter(n => !n.read_at).length)
  }, [memberId])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  async function markAllRead() {
    if (!memberId) return
    const supabase = createClient()
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("member_id", memberId)
      .is("read_at", null)
    fetchNotifications()
  }

  return { notifications, unreadCount, markAllRead, refetch: fetchNotifications }
}
