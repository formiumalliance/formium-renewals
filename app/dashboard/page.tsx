'use client'

import { useEffect, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { KpiCard, LoadingPage, Card } from '@/components/ui'
import { StatusBadge } from '@/components/ui'
import { formatDate, getDaysUntilExpiry, formatCurrency } from '@/lib/utils'
import {
  Users, Globe, FileText, AlertTriangle, CheckCircle, TrendingUp,
  DollarSign, Clock, XCircle, Activity
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const api = useApi()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingPage />

  const { kpis, alerts, charts } = data || {}

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Overview of your clients, domains, and AMC contracts
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <KpiCard title="Total Clients" value={kpis?.totalClients ?? 0} icon={Users} color="blue" />
        <KpiCard title="Active Domains" value={kpis?.activeDomains ?? 0} icon={Globe} color="green" />
        <KpiCard title="Active AMCs" value={kpis?.activeAmcs ?? 0} icon={FileText} color="purple" />
        <KpiCard title="Total Revenue" value={formatCurrency(kpis?.totalAmcRevenue ?? 0)} icon={DollarSign} color="blue" />

        <KpiCard title="Expiring in 7 Days" value={kpis?.domainsExp7 ?? 0} icon={AlertTriangle} color="red"
          subtitle="Domains" />
        <KpiCard title="Expiring in 15 Days" value={kpis?.domainsExp15 ?? 0} icon={Clock} color="yellow"
          subtitle="Domains" />
        <KpiCard title="Expiring in 30 Days" value={kpis?.domainsExp30 ?? 0} icon={Clock} color="yellow"
          subtitle="Domains" />
        <KpiCard title="Expired Domains" value={kpis?.expiredDomains ?? 0} icon={XCircle} color="red" />

        <KpiCard title="AMC Exp. 7 Days" value={kpis?.amcsExp7 ?? 0} icon={AlertTriangle} color="red" />
        <KpiCard title="AMC Exp. 15 Days" value={kpis?.amcsExp15 ?? 0} icon={Clock} color="yellow" />
        <KpiCard title="AMC Exp. 30 Days" value={kpis?.amcsExp30 ?? 0} icon={Clock} color="yellow" />
        <KpiCard title="Monthly Revenue" value={formatCurrency(kpis?.monthlyAmcRevenue ?? 0)} icon={TrendingUp} color="green" />
      </div>

      {/* Charts + Alerts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 p-5">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Monthly AMC Revenue</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={charts?.monthlyRevenue || []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12, color: '#e2e8f0' }}
                formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Alerts */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Expiry Alerts</h2>
          <div className="space-y-1">
            {alerts?.domains?.length === 0 && alerts?.amcs?.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">All clear! No upcoming expirations.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {alerts?.domains?.map((d: any) => {
                  const days = getDaysUntilExpiry(d.expiryDate)
                  return (
                    <Link key={d.id} href={`/dashboard/domains`} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                      <div className="overflow-hidden">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{d.domainName}</p>
                        <p className="text-xs text-slate-400 truncate">{d.client?.name}</p>
                      </div>
                      <span className={cn('text-xs font-semibold flex-shrink-0 ml-2 px-2 py-0.5 rounded-full',
                        days <= 7 ? 'text-red-600 bg-red-50 dark:bg-red-500/10' : days <= 15 ? 'text-orange-600 bg-orange-50 dark:bg-orange-500/10' : 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10'
                      )}>
                        {days <= 0 ? 'Expired' : `${days}d`}
                      </span>
                    </Link>
                  )
                })}
                {alerts?.amcs?.map((a: any) => {
                  const days = getDaysUntilExpiry(a.expiryDate)
                  return (
                    <Link key={a.id} href={`/dashboard/amc`} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                      <div className="overflow-hidden">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">AMC: {a.amcType}</p>
                        <p className="text-xs text-slate-400 truncate">{a.client?.name}</p>
                      </div>
                      <span className={cn('text-xs font-semibold flex-shrink-0 ml-2 px-2 py-0.5 rounded-full',
                        days <= 7 ? 'text-red-600 bg-red-50 dark:bg-red-500/10' : 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10'
                      )}>
                        {days <= 0 ? 'Expired' : `${days}d`}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/dashboard/clients', label: 'Manage Clients', icon: Users, count: kpis?.totalClients },
          { href: '/dashboard/domains', label: 'Manage Domains', icon: Globe, count: kpis?.activeDomains },
          { href: '/dashboard/amc', label: 'Manage AMCs', icon: FileText, count: kpis?.activeAmcs },
        ].map(({ href, label, icon: Icon, count }) => (
          <Link key={href} href={href}>
            <Card className="p-4 hover:shadow-md transition cursor-pointer flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
                <p className="text-xs text-slate-400">{count} total</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
