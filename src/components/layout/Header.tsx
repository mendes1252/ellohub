"use client"

import { Bell } from "lucide-react"
import Link from "next/link"

interface HeaderProps {
  familyName?: string
  unreadCount?: number
}

export function Header({ familyName, unreadCount = 0 }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-white border-b border-ello-indigo/5 shadow-sm flex items-center justify-between px-5">
      <Link href="/calendario" className="flex items-center gap-2">
        <span className="font-display text-xl text-ello-indigo tracking-tight">ello</span>
        {familyName && (
          <span className="text-sm text-ello-indigo/50 font-body">· {familyName}</span>
        )}
      </Link>

      <Link
        href="/config"
        className="relative rounded-full p-2 hover:bg-ello-indigo/5 transition-colors"
        aria-label={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ""}`}
      >
        <Bell className="h-5 w-5 text-ello-indigo/70" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-ello-rosa" />
        )}
      </Link>
    </header>
  )
}
