import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
