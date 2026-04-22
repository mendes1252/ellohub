"use client"

import { Header } from "./Header"
import { BottomNav } from "./BottomNav"
import { useFamily } from "@/lib/hooks/useFamily"
import { useNotifications } from "@/lib/hooks/useNotifications"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { family, currentMember } = useFamily()
  const { unreadCount } = useNotifications(currentMember?.id)

  return (
    <div className="min-h-screen bg-ello-offwhite">
      <Header familyName={family?.name} unreadCount={unreadCount} />
      <main className="pt-14 pb-20 px-4 max-w-2xl mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
