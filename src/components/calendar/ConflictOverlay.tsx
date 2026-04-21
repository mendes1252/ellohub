"use client"

import { AlertTriangle } from "lucide-react"
import type { Conflict } from "@/lib/hooks/useEvents"
import type { Member } from "@/lib/hooks/useFamily"
import { getConflictBlendColor } from "@/lib/utils/colors"

interface ConflictOverlayProps {
  conflicts: Conflict[]
  members: Member[]
}

export function ConflictOverlay({ conflicts, members }: ConflictOverlayProps) {
  if (conflicts.length === 0) return null

  return (
    <div className="rounded-ello bg-ello-amarelo/10 border border-ello-amarelo/30 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-ello-amarelo" />
        <p className="text-sm font-medium text-ello-indigo">
          {conflicts.length} conflito{conflicts.length > 1 ? "s" : ""} de horário
        </p>
      </div>

      <div className="space-y-2">
        {conflicts.map((c, i) => {
          const memberA = members.find(m => m.id === c.event_a_member)
          const memberB = members.find(m => m.id === c.event_b_member)
          const blendColor = memberA && memberB
            ? getConflictBlendColor(memberA.color, memberB.color)
            : "#888"

          return (
            <div
              key={i}
              className="flex items-start gap-2 p-2 rounded-ello-sm"
              style={{ backgroundColor: `${blendColor}20`, borderLeft: `3px solid ${blendColor}` }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ello-indigo">
                  <span style={{ color: memberA?.color }} className="font-medium">{c.event_a_title}</span>
                  {" e "}
                  <span style={{ color: memberB?.color }} className="font-medium">{c.event_b_title}</span>
                </p>
                <p className="text-[10px] text-ello-indigo/50 mt-0.5">
                  {memberA?.display_name} & {memberB?.display_name} · Horários sobrepostos
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
