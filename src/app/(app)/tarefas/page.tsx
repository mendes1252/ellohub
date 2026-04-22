"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useFamily } from "@/lib/hooks/useFamily"
import { useTasks } from "@/lib/hooks/useTasks"
import { TaskList } from "@/components/tasks/TaskList"
import { TaskForm } from "@/components/tasks/TaskForm"
import { LoadingPulse } from "@/components/shared/LoadingPulse"
import type { TaskWithMember } from "@/lib/hooks/useTasks"

export default function TarefasPage() {
  const { family, members, currentMember, isLoading: familyLoading } = useFamily()
  const { tasks, isLoading: tasksLoading, refetch } = useTasks(family?.id)
  const [showForm, setShowForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskWithMember | null>(null)
  const [defaultListName, setDefaultListName] = useState("Geral")

  function handleAddTask(listName: string) {
    setSelectedTask(null)
    setDefaultListName(listName)
    setShowForm(true)
  }

  function handleEditTask(task: TaskWithMember) {
    setSelectedTask(task)
    setShowForm(true)
  }

  if (familyLoading || tasksLoading) {
    return <div className="py-6"><LoadingPulse lines={4} /></div>
  }

  const lists = tasks.reduce<Record<string, TaskWithMember[]>>((acc, task) => {
    const list = task.list_name ?? "Geral"
    if (!acc[list]) acc[list] = []
    acc[list].push(task)
    return acc
  }, {})

  if (!lists["Geral"]) lists["Geral"] = []

  const listNames = Object.keys(lists).sort((a, b) =>
    a === "Geral" ? -1 : b === "Geral" ? 1 : a.localeCompare(b)
  )

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ello-indigo">Tarefas</h1>
        <button
          onClick={() => handleAddTask("Nova lista")}
          className="flex items-center gap-1.5 text-sm text-ello-turquesa-dark font-medium"
        >
          <Plus className="h-4 w-4" />
          Nova lista
        </button>
      </div>

      {listNames.map(name => (
        <TaskList
          key={name}
          listName={name}
          tasks={lists[name]}
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
          onRefetch={refetch}
        />
      ))}

      <button
        onClick={() => handleAddTask("Geral")}
        className="fixed bottom-20 right-5 h-14 w-14 rounded-full bg-ello-turquesa shadow-lg flex items-center justify-center text-ello-indigo hover:bg-ello-turquesa-dark transition-all active:scale-95 z-20"
        aria-label="Nova tarefa"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {family && currentMember && (
        <TaskForm
          open={showForm}
          onClose={() => { setShowForm(false); setSelectedTask(null) }}
          familyId={family.id}
          members={members}
          currentMemberId={currentMember.id}
          task={selectedTask}
          defaultListName={defaultListName}
          onSaved={refetch}
        />
      )}
    </div>
  )
}
