"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface Member {
  id: string
  family_id: string
  user_id: string | null
  role: "admin" | "member" | "child"
  display_name: string
  color: string
  avatar_url: string | null
}

export interface Family {
  id: string
  name: string
  created_by: string
  subscription_status: string
}

export interface UseFamilyResult {
  family: Family | null
  members: Member[]
  currentMember: Member | null
  isAdmin: boolean
  isPaid: boolean
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useFamily(): UseFamilyResult {
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError(null)
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsLoading(false); return }

      const { data: memberData, error: memErr } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .single()

      if (memErr || !memberData) { setIsLoading(false); return }
      setCurrentMember(memberData)

      const { data: familyData, error: famErr } = await supabase
        .from("families")
        .select("*")
        .eq("id", memberData.family_id)
        .single()

      if (famErr || !familyData) { setIsLoading(false); return }
      setFamily(familyData)

      const { data: allMembers } = await supabase
        .from("members")
        .select("*")
        .eq("family_id", memberData.family_id)
        .order("created_at")

      setMembers(allMembers ?? [])
      setIsLoading(false)
    }

    load().catch(e => { setError(e.message); setIsLoading(false) })
  }, [tick])

  return {
    family,
    members,
    currentMember,
    isAdmin: currentMember?.role === "admin",
    isPaid: family?.subscription_status !== "free",
    isLoading,
    error,
    refetch: () => setTick(t => t + 1),
  }
}
