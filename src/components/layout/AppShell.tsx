import { Header } from "./Header"
import { BottomNav } from "./BottomNav"

interface AppShellProps {
  children: React.ReactNode
  familyName?: string
  unreadCount?: number
}

export function AppShell({ children, familyName, unreadCount }: AppShellProps) {
  return (
    <div className="min-h-screen bg-ello-offwhite">
      <Header familyName={familyName} unreadCount={unreadCount} />
      <main className="pt-14 pb-20 px-4 max-w-2xl mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
