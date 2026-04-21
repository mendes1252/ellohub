"use client"

import { useFamily } from "@/lib/hooks/useFamily"
import { CalendarView } from "@/components/calendar/CalendarView"
import { LoadingPulse } from "@/components/shared/LoadingPulse"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import { Calendar, Users } from "lucide-react"
import Link from "next/link"

export default function CalendarioPage() {
  const { family, members, currentMember, isLoading } = useFamily()

  if (isLoading) {
    return (
      <div className="py-6">
        <LoadingPulse lines={5} />
      </div>
    )
  }

  if (!family || !currentMember) {
    return (
      <div className="py-6">
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="Nenhuma família encontrada"
          description="Crie ou entre em uma família para ver o calendário."
          action={
            <Link href="/onboarding">
              <Button>Criar minha família</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (members.length < 2) {
    return (
      <div className="py-6 space-y-4">
        <CalendarView family={family} members={members} currentMember={currentMember} />
        <div className="bg-ello-turquesa/10 border border-ello-turquesa/30 rounded-ello p-4 flex items-start gap-3">
          <Users className="h-5 w-5 text-ello-turquesa-dark flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-ello-indigo">Convide alguém!</p>
            <p className="text-xs text-ello-indigo/60 mt-0.5">
              O Ello brilha com 2 ou mais membros. Convide seu parceiro(a) ou adicione um filho.
            </p>
            <Link href="/familia">
              <Button variant="outline" size="sm" className="mt-3">Convidar agora</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4">
      <CalendarView family={family} members={members} currentMember={currentMember} />
    </div>
  )
}
