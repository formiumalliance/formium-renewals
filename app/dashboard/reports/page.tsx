'use client'

import { useEffect, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { PageHeader, Card, Button, LoadingPage } from '@/components/ui'
import { Download, BarChart3, FileText, Users, Globe, TrendingUp, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

export default function ReportsPage() {
  const api = useApi()
  const [dashData, setDashData] = useState<any>(null)
  const [amcData, setAmcData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard'),
      api.get('/api/amc?limit=200'),
    ]).then(([dash, amcRes]) => {
      setDashData(dash)
      setAmcData(amcRes.amcs || [])
    }).finally(() => setLoading(false))
  }, [])

  const handleDownload = async (type: string, filename: string) => {
    setDownloading(type)
    try {
      await api.download(`/api/reports?type=${type}`, filename)
    } catch (e) {}
    finally { setDownloading('') }
  }

  // AMC Type breakdown for pie chart
  const amcTypeBreakdown = amcData.reduce((acc: Record<string, number>, a) => {
    const type = a.amcType === 'CUSTOM' && a.customType ? a.customType : a.amcType
    acc[type] = (acc[type] || 0) + a.amount
    return acc
  }, {})

  const pieData = Object.entries(amcTypeBreakdown).map(([name, value]) => ({ name, value }))

  if (loading) return <LoadingPage />

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Reports & Exports" description="Download reports and view revenue analytics" />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(dashData?.kpis?.totalAmcRevenue || 0), icon: DollarSign, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Monthly Revenue', value: formatCurrency(dashData?.kpis?.monthlyAmcRevenue || 0), icon: TrendingUp, color: 'text-green-500 bg-green-50 dark:bg-green-500/10' },
          { label: 'Active AMCs', value: dashData?.kpis?.activeAmcs || 0, icon: FileText, color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10' },
          { label: 'Total Clients', value: dashData?.kpis?.totalClients || 0, icon: Users, color: 'text-orange-500 bg-orange-50 dark:bg-orange-500/10' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="flex items-center gap-3 px-5 py-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" /> Monthly Revenue (Last 6 Months)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dashData?.charts?.monthlyRevenue || []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12, color: '#e2e8f0' }}
                formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* AMC Revenue Breakdown */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-purple-500" /> Revenue by AMC Type
          </h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12, color: '#e2e8f0' }}
                  formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, '']}
                />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Export Section */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Download className="w-4 h-4 text-green-500" /> Export Data (CSV)
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { type: 'clients', label: 'Export Clients', icon: Users, filename: 'clients.csv', desc: 'All client data with domain and AMC counts' },
            { type: 'domains', label: 'Export Domains', icon: Globe, filename: 'domains.csv', desc: 'All domains with expiry and status info' },
            { type: 'amc', label: 'Export AMC Contracts', icon: FileText, filename: 'amc-contracts.csv', desc: 'All AMC contracts with revenue data' },
          ].map(({ type, label, icon: Icon, filename, desc }) => (
            <div key={type} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">{desc}</p>
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                loading={downloading === type}
                onClick={() => handleDownload(type, filename)}
                className="w-full justify-center"
              >
                Download CSV
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
