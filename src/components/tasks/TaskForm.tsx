"use client"

import { useState, useEffect } from "react"
import { Sheet } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { createTask, updateTask, deleteTask } from "@/lib/actions/tasks"
import { MemberAvatar } from "@/components/family/MemberAvatar"
import { cn } from "@/lib/utils/cn"
import type { TaskWithMember } from "@/lib/hooks/useTasks"
import type { Member } from "@/lib/hooks/useFamily"

interface TaskFormProps {
  open: boolean
  onClose: () => void
  familyId: string
  members: Member[]
  currentMemberId: string
  task?: TaskWithMember | null
  defaultListName?: string
  onSaved: () => void
}

export function TaskForm({ open, onClose, familyId, members, currentMemberId, task, defaultListName, onSaved }: TaskFormProps) {
  const isEditing = !!task
  const [title, setTitle] = useState("")
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState("")
  const [listName, setListName] = useState(defaultListName ?? "Geral")
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setAssignedTo(task.assigned_to)
      setDueDate(task.due_date?.split("T")[0] ?? "")
      setListName(task.list_name)
    } else {
      setTitle("")
      setAssignedTo(null)
      setDueDate("")
      setListName(defaultListName ?? "Geral")
    }
    setError("")
  }, [task, open, defaultListName])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError("")
    try {
      const data = {
        title: title.trim(),
        listName,
        assignedTo,
        dueDate: dueDate || null,
      }
      if (isEditing) {
        await updateTask(task.id, data)
      } else {
        await createTask(familyId, data)
      }
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!task) return
    setDeleting(true)
    try {
      await deleteTask(task.id)
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={isEditing ? "Editar tarefa" : "Nova tarefa"}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="O que fazer?"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ex: Pagar conta de luz"
          required
          autoFocus
        />

        <Input
          label="Lista"
          value={listName}
          onChange={e => setListName(e.target.value)}
          placeholder="Geral"
        />

        <div>
          <p className="text-sm font-medium text-ello-indigo mb-2">Para quem?</p>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setAssignedTo(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs border-2 transition-all",
                assignedTo === null
                  ? "border-ello-indigo bg-ello-indigo text-white"
                  : "border-transparent bg-ello-indigo/5 text-ello-indigo/50"
              )}
            >
              Todos
            </button>
            {members.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setAssignedTo(m.id)}
                className={cn(
                  "flex items-center gap-1.5 p-2 rounded-ello-sm border-2 transition-all",
                  assignedTo === m.id ? "border-ello-turquesa bg-ello-turquesa/10" : "border-transparent"
                )}
              >
                <MemberAvatar member={m} size="sm" />
                <span className="text-[10px] text-ello-indigo">{m.display_name}</span>
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Data limite (opcional)"
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          {isEditing && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              loading={deleting}
              aria-label="Excluir tarefa"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {isEditing ? "Salvar" : "Criar tarefa"}
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
