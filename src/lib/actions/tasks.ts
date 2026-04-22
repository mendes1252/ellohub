"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(100),
  listName: z.string().min(1).max(50).default("Geral"),
  assignedTo: z.string().uuid().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

export async function createTask(familyId: string, data: {
  title: string
  listName?: string
  assignedTo?: string | null
  dueDate?: string | null
  notes?: string | null
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autenticado")

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single()
  if (!member) throw new Error("Membro não encontrado")

  const parsed = CreateTaskSchema.parse(data)

  const { data: lastTask } = await supabase
    .from("tasks")
    .select("position")
    .eq("family_id", familyId)
    .eq("list_name", parsed.listName)
    .order("position", { ascending: false })
    .limit(1)
    .single()

  const position = (lastTask?.position ?? 0) + 1

  const { error } = await supabase
    .from("tasks")
    .insert({
      family_id: familyId,
      created_by: member.id,
      title: parsed.title,
      list_name: parsed.listName,
      assigned_to: parsed.assignedTo ?? null,
      due_date: parsed.dueDate ?? null,
      notes: parsed.notes ?? null,
      position,
    })
  if (error) throw error

  revalidatePath("/tarefas")
}

export async function toggleTask(taskId: string) {
  const supabase = await createServerClient()
  const { data: task } = await supabase
    .from("tasks")
    .select("status")
    .eq("id", taskId)
    .single()
  if (!task) throw new Error("Tarefa não encontrada")

  const newStatus = task.status === "pending" ? "done" : "pending"
  const { error } = await supabase
    .from("tasks")
    .update({
      status: newStatus,
      completed_at: newStatus === "done" ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
  if (error) throw error

  revalidatePath("/tarefas")
}

export async function deleteTask(taskId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from("tasks").delete().eq("id", taskId)
  if (error) throw error
  revalidatePath("/tarefas")
}

export async function updateTask(taskId: string, data: {
  title?: string
  listName?: string
  assignedTo?: string | null
  dueDate?: string | null
  notes?: string | null
}) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from("tasks")
    .update({
      title: data.title,
      list_name: data.listName,
      assigned_to: data.assignedTo,
      due_date: data.dueDate ?? null,
      notes: data.notes ?? null,
    })
    .eq("id", taskId)
  if (error) throw error
  revalidatePath("/tarefas")
}
