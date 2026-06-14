'use client'

import { useEffect, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useParams, useRouter } from 'next/navigation'
import { Button, StatusBadge, Card, LoadingPage, AlertBanner } from '@/components/ui'
import { ArrowLeft, Globe, FileText, Clock, Plus, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { formatDate, getDaysUntilExpiry, formatCurrency, formatAmcType } from '@/lib/utils'

export default function ClientDetailPage() {
  const api = useApi()
  const { id } = useParams()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/api/clients/${id}`)
      .then(setClient)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingPage />
  if (error || !client) return (
    <div className="p-6">
      <AlertBanner type="error" message={error || 'Client not found'} />
    </div>
  )

  const activityIcons: Record<string, string> = {
    DOMAIN_ADDED: '🌐',
    DOMAIN_UPDATED: '✏️',
    DOMAIN_DELETED: '🗑️',
    AMC_ADDED: '📄',
    AMC_UPDATED: '✏️',
    AMC_RENEWED: '🔄',
    REMINDER_SENT: '📧',
    CLIENT_UPDATED: '👤',
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => router.back()} />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">{client.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{client.name}</h1>
              {client.companyName && <p className="text-sm text-slate-500">{client.companyName}</p>}
            </div>
          </div>
        </div>
        <Link href={`/dashboard/clients`}>
          <Button variant="outline" size="sm" icon={Edit2}>Edit</Button>
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Email', value: client.email || '—' },
          { label: 'Phone', value: client.phone || '—' },
          { label: 'Member Since', value: formatDate(client.createdAt) },
        ].map(({ label, value }) => (
          <Card key={label} className="px-5 py-4">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</p>
          </Card>
        ))}
      </div>

      {client.notes && (
        <Card className="px-5 py-4">
          <p className="text-xs text-slate-400 mb-1">Notes</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{client.notes}</p>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Domains */}
        <Card>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Domains</h2>
              <span className="text-xs text-slate-400">({client.domains.length})</span>
            </div>
            <Link href={`/dashboard/domains?clientId=${client.id}`}>
              <Button variant="ghost" size="sm" icon={Plus}>Add</Button>
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {client.domains.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No domains added yet</p>
            ) : client.domains.map((d: any) => {
              const days = getDaysUntilExpiry(d.expiryDate)
              return (
                <div key={d.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{d.domainName}</p>
                    <p className="text-xs text-slate-400">Expires {formatDate(d.expiryDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${days <= 7 ? 'text-red-600 bg-red-50' : days <= 30 ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50'}`}>
                      {days <= 0 ? 'Expired' : `${days}d`}
                    </span>
                    <StatusBadge status={d.status} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* AMC Contracts */}
        <Card>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">AMC Contracts</h2>
              <span className="text-xs text-slate-400">({client.amcContracts.length})</span>
            </div>
            <Link href={`/dashboard/amc?clientId=${client.id}`}>
              <Button variant="ghost" size="sm" icon={Plus}>Add</Button>
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {client.amcContracts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No AMC contracts added yet</p>
            ) : client.amcContracts.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatAmcType(a.amcType)}</p>
                  <p className="text-xs text-slate-400">Expires {formatDate(a.expiryDate)} · {formatCurrency(a.amount)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.paymentStatus} />
                  <StatusBadge status={a.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Activity Timeline */}
      {client.activities?.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Activity Timeline</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            {client.activities.map((a: any) => (
              <div key={a.id} className="flex items-start gap-3">
                <span className="text-lg leading-none mt-0.5">{activityIcons[a.activityType] || '📌'}</span>
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{a.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(a.createdAt, 'dd MMM yyyy, hh:mm a')}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
