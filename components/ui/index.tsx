import { cn, getStatusColor, getStatusDot } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

// ─── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const label: Record<string, string> = {
    ACTIVE: 'Active',
    EXPIRING_SOON: 'Expiring Soon',
    EXPIRED: 'Expired',
    PAID: 'Paid',
    PENDING: 'Pending',
    SENT: 'Sent',
    FAILED: 'Failed',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border', getStatusColor(status))}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', getStatusDot(status))} />
      {label[status] || status}
    </span>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'slate'
  subtitle?: string
  href?: string
}

const colorMap = {
  blue: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400',
  green: 'text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400',
  yellow: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 dark:text-yellow-400',
  red: 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400',
  purple: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400',
  slate: 'text-slate-600 bg-slate-50 dark:bg-slate-500/10 dark:text-slate-400',
}

export function KpiCard({ title, value, icon: Icon, color = 'blue', subtitle }: KpiCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-0.5">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  )
}

// ─── Page Header ──────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 pt-6 pb-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-400 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return <div className={cn('border-2 border-blue-600 border-t-transparent rounded-full animate-spin', sizes[size])} />
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )
}

// ─── Table ─────────────────────────────────────────────────────────────────────
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn('px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap', className)}>
      {children}
    </th>
  )
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap', className)}>
      {children}
    </td>
  )
}

export function Tr({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </tr>
  )
}

// ─── Button ─────────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: LucideIcon
}

export function Button({ variant = 'primary', size = 'md', loading, icon: Icon, children, className, disabled, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/20',
    secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    outline: 'border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2',
  }
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      {children}
    </button>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full', sizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ─── Form Field ────────────────────────────────────────────────────────────────
export function FormField({ label, required, children, error }: {
  label: string
  required?: boolean
  children: React.ReactNode
  error?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition',
        className
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition resize-none',
        className
      )}
      rows={3}
      {...props}
    />
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl', className)}>
      {children}
    </div>
  )
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
export function AlertBanner({ type, message }: { type: 'error' | 'success' | 'warning'; message: string }) {
  const styles = {
    error: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400',
    success: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400',
    warning: 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  }
  return (
    <div className={cn('rounded-lg border px-4 py-3 text-sm', styles[type])}>
      {message}
    </div>
  )
}
