"use client"

import { useState } from "react"
import { useFamily } from "@/lib/hooks/useFamily"
import { MemberAvatar } from "@/components/family/MemberAvatar"
import { InviteForm } from "@/components/family/InviteForm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingPulse } from "@/components/shared/LoadingPulse"
import { Badge } from "@/components/ui/badge"
import { addChild } from "@/lib/actions/family"
import { UserPlus, Baby, Crown, Users } from "lucide-react"

const ROLE_LABELS = { admin: "Admin", member: "Membro", child: "Filho(a)" }

export default function FamiliaPage() {
  const { family, members, currentMember, isAdmin, isLoading, refetch } = useFamily()
  const [showInvite, setShowInvite] = useState(false)
  const [showChild, setShowChild] = useState(false)
  const [childName, setChildName] = useState("")
  const [addingChild, setAddingChild] = useState(false)
  const [childError, setChildError] = useState("")

  async function handleAddChild(e: React.FormEvent) {
    e.preventDefault()
    if (!childName.trim() || !family) return
    setAddingChild(true)
    setChildError("")
    try {
      await addChild(family.id, childName.trim())
      setChildName("")
      setShowChild(false)
      refetch()
    } catch (err: any) {
      setChildError(err.message)
    } finally {
      setAddingChild(false)
    }
  }

  if (isLoading) {
    return <div className="py-6"><LoadingPulse lines={3} /></div>
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-ello-indigo/60" />
        <h1 className="font-display text-2xl text-ello-indigo">
          {family?.name ?? "Minha Família"}
        </h1>
      </div>

      {/* Lista de membros */}
      <div className="bg-white rounded-ello shadow-sm divide-y divide-ello-indigo/5">
        {members.map(m => (
          <div key={m.id} className="flex items-center gap-3 p-4">
            <MemberAvatar member={m} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-ello-indigo text-sm">{m.display_name}</p>
                {m.id === currentMember?.id && (
                  <Badge variant="secondary" className="text-[10px]">Você</Badge>
                )}
                {m.role === "admin" && (
                  <Crown className="h-3 w-3 text-ello-amarelo" />
                )}
              </div>
              <p className="text-xs text-ello-indigo/40">{ROLE_LABELS[m.role]}</p>
            </div>
            <span
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: m.color }}
            />
          </div>
        ))}
      </div>

      {/* Ações de admin */}
      {isAdmin && family && (
        <div className="space-y-3">
          {/* Convite */}
          <div className="bg-white rounded-ello shadow-sm p-5 space-y-4">
            <button
              onClick={() => setShowInvite(v => !v)}
              className="flex items-center gap-2 w-full text-left"
            >
              <UserPlus className="h-4 w-4 text-ello-turquesa-dark" />
              <span className="text-sm font-medium text-ello-indigo">Convidar parceiro(a)</span>
            </button>
            {showInvite && (
              <InviteForm
                familyId={family.id}
                onSuccess={refetch}
              />
            )}
          </div>

          {/* Adicionar filho */}
          <div className="bg-white rounded-ello shadow-sm p-5 space-y-4">
            <button
              onClick={() => setShowChild(v => !v)}
              className="flex items-center gap-2 w-full text-left"
            >
              <Baby className="h-4 w-4 text-ello-rosa" />
              <span className="text-sm font-medium text-ello-indigo">Adicionar filho(a)</span>
            </button>
            {showChild && (
              <form onSubmit={handleAddChild} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Nome do filho(a)"
                    value={childName}
                    onChange={e => setChildName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" loading={addingChild} size="sm">
                  Adicionar
                </Button>
              </form>
            )}
            {childError && <p className="text-xs text-red-500">{childError}</p>}
          </div>
        </div>
      )}

      {/* Info sobre limite do plano grátis */}
      {family?.subscription_status === "free" && members.filter(m => m.user_id).length >= 2 && (
        <div className="bg-ello-amarelo/10 border border-ello-amarelo/30 rounded-ello p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-ello-indigo">Plano Grátis · limite de 2 adultos</p>
            <p className="text-xs text-ello-indigo/60 mt-1">
              Faça upgrade para o Plano Família e adicione até 6 membros com IA inclusa.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="mailto:ello@app.com?subject=Quero%20o%20Plano%20Família"
              className="flex-1 text-center text-xs font-medium bg-ello-amarelo text-ello-indigo py-2 px-3 rounded-ello-sm hover:opacity-90 transition-opacity"
            >
              💛 Quero o Plano Família
            </a>
          </div>
          <p className="text-[10px] text-ello-indigo/40">
            Filhos cadastrados não contam no limite de adultos.
          </p>
        </div>
      )}
    </div>
  )
}
