import { Calendar } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

export default function CalendarioPage() {
  return (
    <div className="py-6">
      <h1 className="font-display text-2xl text-ello-indigo mb-6">Calendário</h1>
      <EmptyState
        icon={<Calendar className="h-12 w-12" />}
        title="Calendário em desenvolvimento"
        description="O calendário familiar chegará na Fase 1. Configure o Supabase para começar."
      />
    </div>
  )
}
