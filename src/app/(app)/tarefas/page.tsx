import { CheckSquare } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

export default function TarefasPage() {
  return (
    <div className="py-6">
      <h1 className="font-display text-2xl text-ello-indigo mb-6">Tarefas</h1>
      <EmptyState
        icon={<CheckSquare className="h-12 w-12" />}
        title="Tarefas em desenvolvimento"
        description="As listas compartilhadas chegam na Fase 2."
      />
    </div>
  )
}
