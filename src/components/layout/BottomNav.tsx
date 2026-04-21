"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, CheckSquare, Users, Settings } from "lucide-react"
import { cn } from "@/lib/utils/cn"

const navItems = [
  { href: "/calendario", label: "Calendário", Icon: Calendar },
  { href: "/tarefas", label: "Tarefas", Icon: CheckSquare },
  { href: "/familia", label: "Família", Icon: Users },
  { href: "/config", label: "Config", Icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-white border-t border-ello-indigo/5 flex items-center justify-around px-2 pb-safe"
      aria-label="Navegação principal"
    >
      {navItems.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-1 rounded-ello-sm transition-colors",
              active ? "text-ello-turquesa-dark" : "text-ello-indigo/40"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
