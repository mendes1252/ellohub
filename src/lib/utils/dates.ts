import { format, formatRelative, isToday, isTomorrow, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { ptBR } from "date-fns/locale"

export function formatTime(date: string | Date): string {
  return format(new Date(date), "HH:mm")
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy")
}

export function formatDayHeader(date: Date): string {
  if (isToday(date)) return "Hoje"
  if (isTomorrow(date)) return "Amanhã"
  if (isYesterday(date)) return "Ontem"
  return format(date, "EEE, d MMM", { locale: ptBR })
}

export function getWeekDays(date: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(date, { weekStartsOn: 0 }),
    end: endOfWeek(date, { weekStartsOn: 0 }),
  })
}

export function getMonthDays(date: Date): Date[] {
  return eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  })
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMMM yyyy", { locale: ptBR })
}

export function formatRelativeDate(date: string | Date): string {
  return formatRelative(new Date(date), new Date(), { locale: ptBR })
}
