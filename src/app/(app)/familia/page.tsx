import { Users } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

export default function FamiliaPage() {
  return (
    <div className="py-6">
      <h1 className="font-display text-2xl text-ello-indigo mb-6">Família</h1>
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="Gestão familiar em desenvolvimento"
        description="Membros, convites e avatares chegam na Fase 1."
      />
    </div>
  )
}
