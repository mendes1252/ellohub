"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MEMBER_COLORS } from "@/lib/utils/colors"
import { motion, AnimatePresence } from "framer-motion"

const STEPS = 4

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [familyName, setFamilyName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [error, setError] = useState("")

  async function handleFinish() {
    setLoading(true)
    setError("")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")

      // Check if user already has a family (re-click protection)
      const { data: existingMember } = await supabase
        .from("members")
        .select("family_id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (existingMember) {
        router.push("/calendario")
        return
      }

      const { data: family, error: famErr } = await supabase
        .from("families")
        .insert({ name: familyName, created_by: user.id })
        .select()
        .single()
      if (famErr) throw new Error(`Família: ${famErr.message}`)

      const { error: memErr } = await supabase
        .from("members")
        .insert({
          family_id: family.id,
          user_id: user.id,
          role: "admin",
          display_name: displayName,
          color: MEMBER_COLORS[0].hex,
        })
      if (memErr) throw new Error(`Membro: ${memErr.message}`)

      if (inviteEmail) {
        const { data: member } = await supabase
          .from("members")
          .select("id")
          .eq("family_id", family.id)
          .eq("user_id", user.id)
          .single()

        await supabase.from("invitations").insert({
          family_id: family.id,
          invited_by: member!.id,
          email: inviteEmail,
        })
      }

      router.push("/calendario")
    } catch (e: any) {
      console.error("Onboarding error:", e)
      setError(e.message ?? "Algo deu errado. Tente novamente.")
      setLoading(false)
    }
  }

  const progress = (step / STEPS) * 100

  return (
    <div className="min-h-screen bg-ello-offwhite flex flex-col px-5 py-10">
      <div className="w-full max-w-sm mx-auto">
        {/* Barra de progresso */}
        <div className="h-1 bg-ello-indigo/10 rounded-full mb-10 overflow-hidden">
          <motion.div
            className="h-full bg-ello-turquesa rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="font-display text-2xl text-ello-indigo mb-2">Como podemos te chamar?</h1>
              <p className="text-sm text-ello-indigo/60 mb-8">Este será seu nome no calendário da família.</p>
              <Input
                label="Seu nome"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Ex: Ana"
                autoFocus
              />
              <Button
                className="w-full mt-6"
                onClick={() => setStep(2)}
                disabled={!displayName.trim()}
              >
                Continuar
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="font-display text-2xl text-ello-indigo mb-2">Dê um nome para sua família</h1>
              <p className="text-sm text-ello-indigo/60 mb-8">Todos os membros verão este nome.</p>
              <Input
                label="Nome da família"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                placeholder={`Família ${displayName}`}
                autoFocus
              />
              <Button
                className="w-full mt-6"
                onClick={() => setStep(3)}
                disabled={!familyName.trim()}
              >
                Continuar
              </Button>
              <button onClick={() => setStep(1)} className="w-full mt-3 text-sm text-ello-indigo/50 text-center">
                Voltar
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="font-display text-2xl text-ello-indigo mb-2">Convide quem divide a rotina</h1>
              <p className="text-sm text-ello-indigo/60 mb-8">Enviaremos um link de convite por email. Você pode pular e convidar depois.</p>
              <Input
                label="Email do parceiro(a)"
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="parceiro@exemplo.com"
                autoFocus
              />
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
              <Button className="w-full mt-6" onClick={() => setStep(4)} loading={loading}>
                {inviteEmail ? "Convidar e continuar" : "Continuar"}
              </Button>
              <button onClick={() => setStep(3)} className="w-full mt-3 text-sm text-ello-indigo/50 text-center">
                Pular por agora
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="text-6xl mb-6">🎉</div>
              <h1 className="font-display text-2xl text-ello-indigo mb-3">Pronto! Sua rotina agora tem um lar.</h1>
              <p className="text-sm text-ello-indigo/60 mb-10">
                Bem-vindo(a) ao Ello, {displayName}! A família <strong>{familyName}</strong> está criada.
              </p>
              {error && (
                <p className="text-sm text-red-500 mb-4 bg-red-50 border border-red-200 rounded-ello-sm p-3">
                  {error}
                </p>
              )}
              <Button className="w-full" onClick={handleFinish} loading={loading}>
                Criar primeiro evento
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
