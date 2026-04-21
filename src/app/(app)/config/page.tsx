"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Settings, LogOut } from "lucide-react"

export default function ConfigPage() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-ello-indigo/60" />
        <h1 className="font-display text-2xl text-ello-indigo">Configurações</h1>
      </div>

      <div className="bg-white rounded-ello p-5 space-y-1 shadow-sm">
        <p className="text-xs font-medium text-ello-indigo/40 uppercase tracking-wider mb-3">Conta</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full text-left px-2 py-3 rounded-ello-sm hover:bg-red-50 text-red-500 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Sair da conta</span>
        </button>
      </div>

      <p className="text-xs text-center text-ello-indigo/30">
        Ello v0.1 — Fase 0 (Fundação)
      </p>
    </div>
  )
}
