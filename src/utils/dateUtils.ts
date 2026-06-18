import { format, isToday, parseISO } from 'date-fns'

export function formatDateTime(value: string) {
  return format(parseISO(value), 'd MMM yyyy, HH:mm')
}

export function formatDate(value?: string) {
  if (!value) return ''
  return format(parseISO(value), 'd MMM yyyy')
}

export function isIsoDateToday(value?: string) {
  return value ? isToday(parseISO(value)) : false
}
