'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApi } from '@/hooks/useApi'
import { useSearchParams } from 'next/navigation'
import {
  PageHeader, Button, Modal, FormField, Input, Textarea,
  Table, Th, Td, Tr, EmptyState, LoadingPage, Card, AlertBanner
} from '@/components/ui'
import { Plus, Users, Search, Edit2, Trash2, Eye, Building2, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Client {
  id: string
  name: string
  companyName?: string
  email?: string
  phone?: string
  notes?: string
  createdAt: string
  _count: { domains: number; amcContracts: number }
}

const emptyForm = { name: '', companyName: '', email: '', phone: '', notes: '' }

export default function ClientsPage() {
  const api = useApi()
  const searchParams = useSearchParams()
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      const data = await api.get(`/api/clients?${params}`)
      setClients(data.clients)
      setTotal(data.total)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setEditClient(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (c: Client) => {
    setEditClient(c)
    setForm({ name: c.name, companyName: c.companyName || '', email: c.email || '', phone: c.phone || '', notes: c.notes || '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setError('')
    try {
      if (editClient) {
        await api.put(`/api/clients/${editClient.id}`, form)
      } else {
        await api.post('/api/clients', form)
      }
      setModalOpen(false)
      load()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/api/clients/${deleteId}`)
      setDeleteId(null)
      load()
    } catch (e: any) { setError(e.message) }
  }

  const pages = Math.ceil(total / limit)

  return (
    <div className="p-6">
      <PageHeader
        title="Clients"
        description={`${total} total clients`}
        action={<Button icon={Plus} onClick={openAdd}>Add Client</Button>}
      />

      {error && <div className="mb-4"><AlertBanner type="error" message={error} /></div>}

      <Card>
        {/* Search bar */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search clients…"
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
            />
          </div>
        </div>

        {loading ? <LoadingPage /> : clients.length === 0 ? (
          <EmptyState icon={Users} title="No clients yet" description="Add your first client to get started." action={<Button icon={Plus} onClick={openAdd}>Add Client</Button>} />
        ) : (
          <Table>
            <thead className="bg-slate-50/60 dark:bg-slate-800/40">
              <tr>
                <Th>Client</Th>
                <Th>Company</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Domains</Th>
                <Th>AMCs</Th>
                <Th>Added</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <Tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">{c.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                    </div>
                  </Td>
                  <Td><span className="text-slate-500">{c.companyName || '—'}</span></Td>
                  <Td><span className="text-slate-500">{c.email || '—'}</span></Td>
                  <Td><span className="text-slate-500">{c.phone || '—'}</span></Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
                      {c._count.domains}
                    </span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium">
                      {c._count.amcContracts}
                    </span>
                  </Td>
                  <Td><span className="text-slate-400 text-xs">{formatDate(c.createdAt)}</span></Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Link href={`/dashboard/clients/${c.id}`}>
                        <Button variant="ghost" size="sm" icon={Eye} />
                      </Link>
                      <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(c)} />
                      <Button variant="ghost" size="sm" icon={Trash2}
                        className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                        onClick={() => setDeleteId(c.id)} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400">Page {page} of {pages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editClient ? 'Edit Client' : 'Add Client'}>
        <div className="space-y-4">
          {error && <AlertBanner type="error" message={error} />}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Client Name" required>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
            </FormField>
            <FormField label="Company Name">
              <Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Acme Corp" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email">
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes…" />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editClient ? 'Save Changes' : 'Add Client'}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Client" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
          Are you sure? This will permanently delete the client and all their domains and AMC contracts.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
