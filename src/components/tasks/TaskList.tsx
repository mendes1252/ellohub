"use client"

import { useState } from "react"
import { Plus, ChevronDown, ChevronUp } from "lucide-react"
import { TaskItem } from "./TaskItem"
import type { TaskWithMember } from "@/lib/hooks/useTasks"

interface TaskListProps {
  listName: string
  tasks: TaskWithMember[]
  onAddTask: (listName: string) => void
  onEditTask: (task: TaskWithMember) => void
  onRefetch: () => void
}

export function TaskList({ listName, tasks, onAddTask, onEditTask, onRefetch }: TaskListProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pending = tasks.filter(t => t.status === "pending")
  const done = tasks.filter(t => t.status === "done")

  return (
    <div className="bg-white rounded-ello shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-ello-indigo/5">
        <button
          onClick={() => setCollapsed(v => !v)}
          className="flex items-center gap-2 flex-1 text-left min-w-0"
        >
          <h3 className="font-medium text-sm text-ello-indigo truncate">{listName}</h3>
          {pending.length > 0 && (
            <span className="text-xs text-ello-indigo/40 flex-shrink-0">{pending.length}</span>
          )}
          {collapsed
            ? <ChevronDown className="h-3.5 w-3.5 text-ello-indigo/30 ml-auto flex-shrink-0" />
            : <ChevronUp className="h-3.5 w-3.5 text-ello-indigo/30 ml-auto flex-shrink-0" />
          }
        </button>
        <button
          onClick={() => onAddTask(listName)}
          className="p-1.5 rounded-full hover:bg-ello-turquesa/10 transition-colors ml-2 flex-shrink-0"
          aria-label={`Adicionar tarefa em ${listName}`}
        >
          <Plus className="h-4 w-4 text-ello-turquesa-dark" />
        </button>
      </div>

      {!collapsed && (
        <div className="divide-y divide-ello-indigo/5">
          {pending.map(t => (
            <TaskItem key={t.id} task={t} onEdit={onEditTask} onRefetch={onRefetch} />
          ))}
          {done.length > 0 && (
            <div className="bg-ello-offwhite/60 divide-y divide-ello-indigo/5">
              {done.map(t => (
                <TaskItem key={t.id} task={t} onEdit={onEditTask} onRefetch={onRefetch} />
              ))}
            </div>
          )}
          {tasks.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-ello-indigo/30">Nenhuma tarefa ainda</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
