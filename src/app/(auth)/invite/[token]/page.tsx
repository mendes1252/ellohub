"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LoadingPulse } from "@/components/shared/LoadingPulse"

interface InviteData {
  family_id: string
  email: string
  status: string
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchInvite() {
      const { data } = await supabase
        .from("invitations")
        .select("family_id, email, status")
        .eq("token", token)
        .single()

      setInvite(data)
      setLoading(false)
    }
    fetchInvite()
  }, [token])

  async function handleAccept() {
    setAccepting(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/login?next=/invite/${token}`)
      return
    }

    const { error } = await supabase.rpc("accept_invitation", {
      p_token: token,
      p_user_id: user.id,
    } as any)

    if (error) {
      setError("Não foi possível aceitar o convite. Ele pode ter expirado.")
      setAccepting(false)
    } else {
      router.push("/calendario")
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingPulse lines={2} /></div>

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

  return (
    <div className="min-h-screen bg-ello-offwhite flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm bg-white rounded-ello p-8 shadow-sm text-center">
        <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
        <h1 className="font-display text-2xl text-ello-indigo mb-2">Você foi convidado!</h1>
        <p className="text-sm text-ello-indigo/60 mb-8">
          Acesse o calendário e as tarefas da família.
        </p>
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        <Button className="w-full" onClick={handleAccept} loading={accepting}>
          Aceitar e entrar
        </Button>
      </div>
    </div>
  )
}
