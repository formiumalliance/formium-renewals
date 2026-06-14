'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Globe, FileText, Calendar,
  Mail, BarChart3, Settings, LogOut, Layers, ChevronRight
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/domains', label: 'Domains', icon: Globe },
  { href: '/dashboard/amc', label: 'AMC Contracts', icon: FileText },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/email-logs', label: 'Email Logs', icon: Mail },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
]

const adminItems = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group',
          active
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
        )}
      >
        <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300')} />
        {label}
        {active && <ChevronRight className="w-3 h-3 ml-auto text-blue-500 dark:text-blue-400" />}
      </Link>
    )
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <div className="overflow-hidden">
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">AMC Dashboard</p>
          <p className="text-xs text-slate-400 truncate">Formium Agency</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map(item => <NavLink key={item.href} {...item} />)}

        {isAdmin && (
          <>
            <div className="pt-3 pb-1">
              <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</p>
            </div>
            {adminItems.map(item => <NavLink key={item.href} {...item} />)}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition group cursor-default">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">{user?.name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-500"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
