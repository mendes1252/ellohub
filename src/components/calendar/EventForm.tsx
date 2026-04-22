"use client"

import { useState, useEffect } from "react"
import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import { createEvent, updateEvent, deleteEvent } from "@/lib/actions/events"
import { MemberAvatar } from "@/components/family/MemberAvatar"
import { cn } from "@/lib/utils/cn"
import type { EventWithMember } from "@/lib/hooks/useEvents"
import type { Member } from "@/lib/hooks/useFamily"
import { format } from "date-fns"

const CATEGORIES = [
  { value: "outro", label: "Outro" },
  { value: "saude", label: "Saúde" },
  { value: "lazer", label: "Lazer" },
  { value: "escola", label: "Escola" },
  { value: "trabalho", label: "Trabalho" },
] as const

interface EventFormProps {
  open: boolean
  onClose: () => void
  familyId: string
  members: Member[]
  currentMemberId: string
  event?: EventWithMember | null
  defaultDate?: Date
  onSaved: () => void
}

function toLocalDatetimeString(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

export function EventForm({ open, onClose, familyId, members, currentMemberId, event, defaultDate, onSaved }: EventFormProps) {
  const isEditing = !!event

  const defaultStart = defaultDate ?? new Date()
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000)

  const [title, setTitle] = useState("")
  const [memberId, setMemberId] = useState(currentMemberId)
  const [startsAt, setStartsAt] = useState(toLocalDatetimeString(defaultStart))
  const [endsAt, setEndsAt] = useState(toLocalDatetimeString(defaultEnd))
  const [category, setCategory] = useState<string>("outro")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [allDay, setAllDay] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setMemberId(event.member_id)
      setStartsAt(toLocalDatetimeString(new Date(event.starts_at)))
      setEndsAt(toLocalDatetimeString(new Date(event.ends_at)))
      setCategory(event.category)
      setLocation(event.location ?? "")
      setDescription(event.description ?? "")
      setAllDay(event.all_day)
    } else {
      setTitle("")
      setMemberId(currentMemberId)
      setStartsAt(toLocalDatetimeString(defaultDate ?? new Date()))
      setEndsAt(toLocalDatetimeString(new Date((defaultDate ?? new Date()).getTime() + 3600000)))
      setCategory("outro")
      setLocation("")
      setDescription("")
      setAllDay(false)
    }
    setError("")
  }, [event, open, currentMemberId, defaultDate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError("")
    try {
      const data = {
        title: title.trim(),
        memberId,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        category: category as any,
        location: location || undefined,
        description: description || undefined,
        allDay,
      }
      if (isEditing) {
        await updateEvent(event.id, data)
      } else {
        await createEvent(familyId, data)
      }
      onSaved()
      onClose()
    } catch (err: any) {
      console.error("Erro ao salvar evento:", err)
      setError(err?.message ?? "Erro ao salvar evento")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!event) return
    setDeleting(true)
    try {
      await deleteEvent(event.id)
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const humanMembers = members.filter(m => m.role !== "child" || !m.user_id === false)

  return (
    <Sheet open={open} onClose={onClose} title={isEditing ? "Editar evento" : "Novo evento"}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Título */}
        <Input
          label="Título"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ex: Natação do Léo"
          required
          autoFocus
        />

        {/* Membro */}
        <div>
          <p className="text-sm font-medium text-ello-indigo mb-2">Para quem?</p>
          <div className="flex gap-3 flex-wrap">
            {members.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMemberId(m.id)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-ello-sm border-2 transition-all",
                  memberId === m.id ? "border-ello-turquesa bg-ello-turquesa/10" : "border-transparent"
                )}
              >
                <MemberAvatar member={m} size="sm" />
                <span className="text-[10px] text-ello-indigo">{m.display_name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dia todo */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allDay}
            onChange={e => setAllDay(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-ello-indigo">Dia todo</span>
        </label>

        {/* Datas */}
        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Início"
              type="datetime-local"
              value={startsAt}
              onChange={e => setStartsAt(e.target.value)}
              required
            />
            <Input
              label="Fim"
              type="datetime-local"
              value={endsAt}
              onChange={e => setEndsAt(e.target.value)}
              required
            />
          </div>
        )}

        {allDay && (
          <Input
            label="Data"
            type="date"
            value={startsAt.split("T")[0]}
            onChange={e => {
              setStartsAt(`${e.target.value}T00:00`)
              setEndsAt(`${e.target.value}T23:59`)
            }}
            required
          />
        )}

        {/* Categoria */}
        <div>
          <p className="text-sm font-medium text-ello-indigo mb-2">Categoria</p>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs border transition-all",
                  category === c.value
                    ? "bg-ello-indigo text-white border-ello-indigo"
                    : "border-ello-indigo/20 text-ello-indigo/60"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Local */}
        <Input
          label="Local (opcional)"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Ex: Clube Atlético"
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
              aria-label="Excluir evento"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {isEditing ? "Salvar" : "Criar evento"}
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
