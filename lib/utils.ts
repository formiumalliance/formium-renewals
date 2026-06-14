import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDaysUntilExpiry(expiryDate: Date | string): number {
  const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate
  return differenceInDays(expiry, new Date())
}

export function getDomainStatus(expiryDate: Date | string): 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' {
  const days = getDaysUntilExpiry(expiryDate)
  if (days < 0) return 'EXPIRED'
  if (days <= 30) return 'EXPIRING_SOON'
  return 'ACTIVE'
}

export function getAmcStatus(expiryDate: Date | string): 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' {
  const days = getDaysUntilExpiry(expiryDate)
  if (days < 0) return 'EXPIRED'
  if (days <= 30) return 'EXPIRING_SOON'
  return 'ACTIVE'
}

export function formatDate(date: Date | string, formatStr: string = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr)
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'AED ',
  }
  const symbol = symbols[currency] || currency + ' '
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function formatAmcType(type: string): string {
  const map: Record<string, string> = {
    WEBSITE_MAINTENANCE: 'Website Maintenance',
    SEO: 'SEO',
    ADS_MANAGEMENT: 'Ads Management',
    HOSTING: 'Hosting',
    DOMAIN_MANAGEMENT: 'Domain Management',
    CUSTOM: 'Custom',
  }
  return map[type] || type
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'text-green-600 bg-green-50 border-green-200',
    EXPIRING_SOON: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    EXPIRED: 'text-red-600 bg-red-50 border-red-200',
    PAID: 'text-green-600 bg-green-50 border-green-200',
    PENDING: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  }
  return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200'
}

export function getStatusDot(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-500',
    EXPIRING_SOON: 'bg-yellow-500',
    EXPIRED: 'bg-red-500',
    PAID: 'bg-green-500',
    PENDING: 'bg-yellow-500',
  }
  return colors[status] || 'bg-gray-400'
}

export function paginateArray<T>(array: T[], page: number, limit: number): { data: T[]; total: number; pages: number } {
  const total = array.length
  const pages = Math.ceil(total / limit)
  const data = array.slice((page - 1) * limit, page * limit)
  return { data, total, pages }
}

export function generateCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (val: string | number | null | undefined) => {
    const str = val?.toString() || ''
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  const lines = [headers.map(escape).join(','), ...rows.map(row => row.map(escape).join(','))]
  return lines.join('\n')
}
