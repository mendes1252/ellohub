"use client"

import { useState } from "react"
import { Check, Trash2 } from "lucide-react"
import { toggleTask, deleteTask } from "@/lib/actions/tasks"
import { cn } from "@/lib/utils/cn"
import type { TaskWithMember } from "@/lib/hooks/useTasks"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TaskItemProps {
  task: TaskWithMember
  onEdit: (task: TaskWithMember) => void
}

export function TaskItem({ task, onEdit }: TaskItemProps) {
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isDone = task.status === "done"

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    setToggling(true)
    try { await toggleTask(task.id) } finally { setToggling(false) }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setDeleting(true)
    try { await deleteTask(task.id) } finally { setDeleting(false) }
  }

  return (
    <div
      onClick={() => onEdit(task)}
      className={cn(
        "flex items-center gap-3 p-4 cursor-pointer transition-opacity active:bg-ello-indigo/2",
        isDone && "opacity-50"
      )}
    >
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={cn(
          "h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all",
          isDone
            ? "bg-ello-turquesa border-ello-turquesa"
            : "border-ello-indigo/30 hover:border-ello-turquesa"
        )}
      >
        {isDone && <Check className="h-3 w-3 text-ello-indigo" strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm text-ello-indigo", isDone && "line-through")}>
          {task.title}
        </p>
        {(task.member || task.due_date) && (
          <div className="flex items-center gap-2 mt-0.5">
            {task.member && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${task.member.color}25`,
                  color: task.member.color,
                }}
              >
                {task.member.display_name}
              </span>
            )}
            {task.due_date && (
              <span className="text-[10px] text-ello-indigo/40">
                {format(new Date(task.due_date + "T12:00"), "d MMM", { locale: ptBR })}
              </span>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="p-1 text-ello-indigo/20 hover:text-red-400 transition-colors flex-shrink-0"
        aria-label="Excluir tarefa"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
