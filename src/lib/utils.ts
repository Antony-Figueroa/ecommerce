import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function removeDiacritics(str: string): string {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function fuzzySearch(query: string, target: string): boolean {
  if (!query) return true
  if (!target) return false
  
  const normalizedQuery = removeDiacritics(query).trim()
  const normalizedTarget = removeDiacritics(target)
  
  if (normalizedTarget.includes(normalizedQuery)) return true
  
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0)
  const targetWords = normalizedTarget.split(/\s+/)
  
  return queryWords.every(qWord => 
    targetWords.some(tWord => tWord.includes(qWord))
  )
}

export function formatUSD(amount: number | string | any): string {
  const value = typeof amount === 'number' ? amount : Number(amount)
  if (isNaN(value)) return '0.00'
  return value.toFixed(2)
}

export function formatBS(amount: number | string | any): string {
  const value = typeof amount === 'number' ? amount : Number(amount)
  if (isNaN(value)) return '0,00'
  return value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
