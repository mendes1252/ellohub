"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { acceptInvite } from "@/lib/actions/family"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingPulse } from "@/components/shared/LoadingPulse"

interface InviteData {
  family_id: string
  email: string
  status: string
  families: { name: string } | null
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()

  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Step for new users: enter name after accepting
  const [needsName, setNeedsName] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)

      const { data } = await supabase
        .from("invitations")
        .select("family_id, email, status, families(name)")
        .eq("token", token)
        .single()

      setInvite(data as any)
      setLoading(false)
    }
    load()
  }, [token])

  async function handleAccept() {
    setAccepting(true)
    setError("")
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/login?next=/invite/${token}`)
      return
    }

    try {
      await acceptInvite(token)
      setNeedsName(true)
      setDisplayName(user.email?.split("@")[0] ?? "")
    } catch (e: any) {
      setError(e.message)
      setAccepting(false)
    }
  }

  async function handleSaveName() {
    if (!displayName.trim()) return
    setSavingName(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !invite) { router.push("/calendario"); return }

    // Find the member record just created and update the name
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("family_id", invite.family_id)
      .eq("user_id", user.id)
      .single()

    if (member) {
      await supabase.from("members").update({ display_name: displayName.trim() }).eq("id", member.id)
    }

    router.push("/calendario")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingPulse lines={2} />
      </div>
    )
  }

  if (!invite || invite.status !== "pending") {
    return (
      <div className="min-h-screen bg-ello-offwhite flex flex-col items-center justify-center px-5 text-center">
        <div className="text-4xl mb-4">😕</div>
        <h1 className="font-display text-2xl text-ello-indigo mb-2">Convite inválido</h1>
        <p className="text-sm text-ello-indigo/60">Este convite expirou ou já foi usado.</p>
        <Button className="mt-6" onClick={() => router.push("/login")}>Ir para o app</Button>
      </div>
    )
  }

  if (needsName) {
    return (
      <div className="min-h-screen bg-ello-offwhite flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm bg-white rounded-ello p-8 shadow-sm space-y-5">
          <div className="text-center">
            <div className="text-4xl mb-3">👋</div>
            <h1 className="font-display text-xl text-ello-indigo">Como quer ser chamado(a)?</h1>
            <p className="text-xs text-ello-indigo/50 mt-1">Este nome aparece no calendário da família.</p>
          </div>
          <Input
            label="Seu nome"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Ex: Ana"
            autoFocus
            onKeyDown={e => e.key === "Enter" && handleSaveName()}
          />
          <Button className="w-full" onClick={handleSaveName} loading={savingName} disabled={!displayName.trim()}>
            Entrar na família
          </Button>
        </div>
      </div>
    )
  }

  const familyName = (invite as any).families?.name ?? "família"

  return (
    <div className="min-h-screen bg-ello-offwhite flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm bg-white rounded-ello p-8 shadow-sm text-center space-y-4">
        <div className="text-5xl">👨‍👩‍👧‍👦</div>
        <div>
          <h1 className="font-display text-2xl text-ello-indigo">Você foi convidado!</h1>
          <p className="text-sm text-ello-indigo/60 mt-2">
            Para entrar na família <strong>{familyName}</strong> no Ello.
          </p>
        </div>

        {!isLoggedIn && (
          <div className="bg-ello-turquesa/10 rounded-ello-sm p-3">
            <p className="text-xs text-ello-indigo/70">
              Você precisará fazer login ou criar uma conta com o email <strong>{invite.email}</strong>.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button className="w-full" onClick={handleAccept} loading={accepting}>
          {isLoggedIn ? "Aceitar e entrar" : "Fazer login e aceitar"}
        </Button>
      </div>
    </div>
  )
}
