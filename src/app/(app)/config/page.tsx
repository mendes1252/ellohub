"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useFamily } from "@/lib/hooks/useFamily"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { updateMemberProfile, updateMemberColor } from "@/lib/actions/family"
import { MemberAvatar } from "@/components/family/MemberAvatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingPulse } from "@/components/shared/LoadingPulse"
import { MEMBER_COLORS } from "@/lib/utils/colors"
import { cn } from "@/lib/utils/cn"
import { createClient } from "@/lib/supabase/client"
import { LogOut, User, Bell, BellOff } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const NOTIFICATION_ICONS: Record<string, string> = {
  morning_summary: "☀️",
  event_reminder: "🔔",
  conflict_alert: "⚠️",
  task_assigned: "✅",
  member_joined: "👋",
  weekly_report: "📊",
}

export default function ConfigPage() {
  const router = useRouter()
  const { currentMember, family, isLoading, refetch } = useFamily()
  const { notifications, unreadCount, markAllRead } = useNotifications(currentMember?.id)

  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState("")
  const [savingName, setSavingName] = useState(false)
  const [savingColor, setSavingColor] = useState<string | null>(null)
  const [tab, setTab] = useState<"perfil" | "notificacoes">("perfil")

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  async function handleSaveName() {
    if (!newName.trim() || !currentMember) return
    setSavingName(true)
    try {
      await updateMemberProfile(currentMember.id, newName.trim())
      refetch()
      setEditingName(false)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSavingName(false)
    }
  }

  async function handleColorSelect(color: string) {
    if (!currentMember || savingColor) return
    setSavingColor(color)
    try {
      await updateMemberColor(currentMember.id, color)
      refetch()
    } finally {
      setSavingColor(null)
    }
  }

  if (isLoading) return <div className="py-6"><LoadingPulse lines={5} /></div>

  return (
    <div className="py-6 space-y-5">
      <h1 className="font-display text-2xl text-ello-indigo">Configurações</h1>

      {/* Tabs */}
      <div className="flex bg-ello-indigo/5 rounded-ello-sm p-0.5">
        {(["perfil", "notificacoes"] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === "notificacoes") markAllRead() }}
            className={cn(
              "flex-1 py-2 rounded-ello-sm text-xs font-medium transition-all capitalize relative",
              tab === t ? "bg-white text-ello-indigo shadow-sm" : "text-ello-indigo/50"
            )}
          >
            {t === "notificacoes" ? "Notificações" : "Perfil"}
            {t === "notificacoes" && unreadCount > 0 && (
              <span className="absolute top-1 right-3 h-2 w-2 rounded-full bg-ello-rosa" />
            )}
          </button>
        ))}
      </div>

      {tab === "perfil" && (
        <>
          {/* Avatar + Nome */}
          <div className="bg-white rounded-ello shadow-sm p-5 space-y-4">
            <p className="text-xs font-medium text-ello-indigo/40 uppercase tracking-wider">Meu perfil</p>

            {currentMember && (
              <div className="flex items-center gap-4">
                <MemberAvatar member={currentMember} size="lg" />
                <div>
                  <p className="font-semibold text-ello-indigo">{currentMember.display_name}</p>
                  <p className="text-xs text-ello-indigo/40 capitalize mt-0.5">
                    {currentMember.role === "admin" ? "Administrador(a)" : "Membro"}
                  </p>
                </div>
              </div>
            )}

            {editingName ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Novo nome"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && handleSaveName()}
                  />
                </div>
                <Button size="sm" onClick={handleSaveName} loading={savingName}>Salvar</Button>
                <Button size="sm" variant="outline" onClick={() => setEditingName(false)}>✕</Button>
              </div>
            ) : (
              <button
                onClick={() => { setNewName(currentMember?.display_name ?? ""); setEditingName(true) }}
                className="flex items-center gap-2 text-sm text-ello-turquesa-dark font-medium"
              >
                <User className="h-4 w-4" />
                Editar nome
              </button>
            )}
          </div>

          {/* Cor */}
          <div className="bg-white rounded-ello shadow-sm p-5 space-y-4">
            <p className="text-xs font-medium text-ello-indigo/40 uppercase tracking-wider">Minha cor</p>
            <p className="text-xs text-ello-indigo/60">Aparece nos seus eventos e tarefas.</p>
            <div className="flex gap-4">
              {MEMBER_COLORS.map(c => (
                <button
                  key={c.hex}
                  onClick={() => handleColorSelect(c.hex)}
                  disabled={!!savingColor}
                  className={cn(
                    "h-11 w-11 rounded-full border-4 transition-all",
                    currentMember?.color === c.hex
                      ? "border-ello-indigo scale-110 shadow-md"
                      : "border-white shadow-sm hover:scale-105"
                  )}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Família */}
          <div className="bg-white rounded-ello shadow-sm p-5 space-y-2">
            <p className="text-xs font-medium text-ello-indigo/40 uppercase tracking-wider">Família</p>
            <p className="text-sm font-medium text-ello-indigo">{family?.name}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-ello-indigo/50">
                {family?.subscription_status === "free"
                  ? "Plano Grátis · 2 membros · 50 eventos/mês"
                  : "Plano Família · 6 membros · eventos ilimitados"}
              </p>
              {family?.subscription_status === "free" && (
                <span className="text-[10px] bg-ello-amarelo/30 text-ello-indigo px-2 py-0.5 rounded-full font-medium">
                  Grátis
                </span>
              )}
            </div>
          </div>

          {/* Logout */}
          <div className="bg-white rounded-ello shadow-sm p-5">
            <p className="text-xs font-medium text-ello-indigo/40 uppercase tracking-wider mb-3">Conta</p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full text-left px-2 py-2 rounded-ello-sm hover:bg-red-50 text-red-500 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Sair da conta</span>
            </button>
          </div>

          <p className="text-xs text-center text-ello-indigo/30">Ello v0.3 · Fase 3</p>
        </>
      )}

      {tab === "notificacoes" && (
        <div className="bg-white rounded-ello shadow-sm overflow-hidden">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <BellOff className="h-10 w-10 text-ello-indigo/20" />
              <p className="text-sm text-ello-indigo/40">Nenhuma notificação ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-ello-indigo/5">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-3 p-4",
                    !n.read_at && "bg-ello-turquesa/5"
                  )}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">
                    {NOTIFICATION_ICONS[n.type] ?? "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-ello-indigo">{n.title}</p>
                      {!n.read_at && (
                        <span className="h-2 w-2 rounded-full bg-ello-rosa flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-ello-indigo/60 mt-0.5 whitespace-pre-line">{n.message}</p>
                    <p className="text-[10px] text-ello-indigo/30 mt-1">
                      {format(new Date(n.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
