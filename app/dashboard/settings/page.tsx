'use client'

import { useEffect, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
  PageHeader, Button, FormField, Input, Select, Card, AlertBanner, Spinner
} from '@/components/ui'
import { Settings, Users, Bell, Palette, Globe, Plus, Edit2, Trash2, ShieldCheck, ShieldOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'system', label: 'System Settings', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

export default function SettingsPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const api = useApi()
  const [tab, setTab] = useState('users')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Users state
  const [users, setUsers] = useState<any[]>([])
  const [userModal, setUserModal] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'MANAGER' })
  const [savingUser, setSavingUser] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    currency: 'INR', currencyPosition: 'before', timezone: 'Asia/Kolkata', dateFormat: 'DD/MM/YYYY'
  })

  // Notifications state
  const [notifConfig, setNotifConfig] = useState<any>({
    adminEmail: 'hello@formium.in', additionalEmails: [], domainAlerts: true, amcAlerts: true, systemAlerts: true
  })
  const [additionalEmailInput, setAdditionalEmailInput] = useState('')

  useEffect(() => {
    if (!isAdmin) { router.push('/dashboard'); return }
    loadUsers()
    loadSystemSettings()
    loadNotifications()
  }, [isAdmin])

  const loadUsers = () => api.get('/api/users').then(setUsers).catch(() => {})
  const loadSystemSettings = () => api.get('/api/settings/system').then(d => {
    if (d) setSystemSettings(prev => ({ ...prev, ...d }))
  }).catch(() => {})
  const loadNotifications = () => api.get('/api/settings/notifications').then(d => {
    if (d) setNotifConfig(d)
  }).catch(() => {})

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

  // User CRUD
  const openAddUser = () => { setEditUser(null); setUserForm({ name: '', email: '', password: '', role: 'MANAGER' }); setUserModal(true) }
  const openEditUser = (u: any) => { setEditUser(u); setUserForm({ name: u.name, email: u.email, password: '', role: u.role }); setUserModal(true) }

  const saveUser = async () => {
    setSavingUser(true); setError('')
    try {
      if (editUser) {
        const body: any = { name: userForm.name, email: userForm.email, role: userForm.role }
        if (userForm.password) body.password = userForm.password
        await api.put(`/api/users/${editUser.id}`, body)
      } else {
        await api.post('/api/users', userForm)
      }
      setUserModal(false)
      loadUsers()
      showSuccess('User saved successfully')
    } catch (e: any) { setError(e.message) }
    finally { setSavingUser(false) }
  }

  const toggleUserStatus = async (u: any) => {
    try {
      await api.put(`/api/users/${u.id}`, { isActive: !u.isActive })
      loadUsers()
    } catch (e: any) { setError(e.message) }
  }

  const deleteUser = async () => {
    if (!deleteUserId) return
    try {
      await api.delete(`/api/users/${deleteUserId}`)
      setDeleteUserId(null)
      loadUsers()
      showSuccess('User deleted')
    } catch (e: any) { setError(e.message) }
  }

  // System settings
  const saveSystemSettings = async () => {
    setLoading(true); setError('')
    try {
      await api.post('/api/settings/system', systemSettings)
      showSuccess('Settings saved')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  // Notifications
  const saveNotifications = async () => {
    setLoading(true); setError('')
    try {
      await api.put('/api/settings/notifications', notifConfig)
      showSuccess('Notification settings saved')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const addEmail = () => {
    const email = additionalEmailInput.trim()
    if (!email || !email.includes('@')) return
    if (!notifConfig.additionalEmails.includes(email)) {
      setNotifConfig((c: any) => ({ ...c, additionalEmails: [...c.additionalEmails, email] }))
    }
    setAdditionalEmailInput('')
  }

  if (!isAdmin) return null

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Settings" description="Manage users, system preferences, and notifications" />

      {success && <AlertBanner type="success" message={success} />}
      {error && <AlertBanner type="error" message={error} />}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
              tab === id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ─── USERS TAB ─── */}
      {tab === 'users' && (
        <Card>
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Team Members</h2>
            <Button icon={Plus} size="sm" onClick={openAddUser}>Add User</Button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">{u.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      {u.name}
                      {!u.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500">Disabled</span>}
                    </p>
                    <p className="text-xs text-slate-400">{u.email} · {u.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" icon={u.isActive ? ShieldOff : ShieldCheck}
                    className={u.isActive ? 'hover:text-red-600' : 'hover:text-green-600'}
                    onClick={() => toggleUserStatus(u)}
                    title={u.isActive ? 'Disable user' : 'Enable user'} />
                  <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEditUser(u)} />
                  <Button variant="ghost" size="sm" icon={Trash2}
                    className="hover:text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteUserId(u.id)} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── SYSTEM SETTINGS TAB ─── */}
      {tab === 'system' && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-5">System Preferences</h2>
          <div className="grid grid-cols-2 gap-5 max-w-2xl">
            <FormField label="Currency">
              <Select value={systemSettings.currency} onChange={e => setSystemSettings(s => ({ ...s, currency: e.target.value }))}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AED">AED</option>
              </Select>
            </FormField>
            <FormField label="Currency Position">
              <Select value={systemSettings.currencyPosition} onChange={e => setSystemSettings(s => ({ ...s, currencyPosition: e.target.value }))}>
                <option value="before">Before Amount (₹1,000)</option>
                <option value="after">After Amount (1,000₹)</option>
              </Select>
            </FormField>
            <FormField label="Timezone">
              <Select value={systemSettings.timezone} onChange={e => setSystemSettings(s => ({ ...s, timezone: e.target.value }))}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              </Select>
            </FormField>
            <FormField label="Date Format">
              <Select value={systemSettings.dateFormat} onChange={e => setSystemSettings(s => ({ ...s, dateFormat: e.target.value }))}>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </Select>
            </FormField>
          </div>
          <div className="mt-6">
            <Button onClick={saveSystemSettings} loading={loading}>Save Settings</Button>
          </div>
        </Card>
      )}

      {/* ─── NOTIFICATIONS TAB ─── */}
      {tab === 'notifications' && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-5">Notification Settings</h2>
          <div className="space-y-5 max-w-2xl">
            <FormField label="Primary Admin Email">
              <Input
                type="email"
                value={notifConfig.adminEmail}
                onChange={e => setNotifConfig((c: any) => ({ ...c, adminEmail: e.target.value }))}
                placeholder="hello@formium.in"
              />
            </FormField>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Additional Admin Emails
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  type="email"
                  value={additionalEmailInput}
                  onChange={e => setAdditionalEmailInput(e.target.value)}
                  placeholder="another@email.com"
                  onKeyDown={e => e.key === 'Enter' && addEmail()}
                />
                <Button variant="outline" onClick={addEmail} icon={Plus}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {notifConfig.additionalEmails?.map((email: string) => (
                  <span key={email} className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full">
                    {email}
                    <button onClick={() => setNotifConfig((c: any) => ({ ...c, additionalEmails: c.additionalEmails.filter((e: string) => e !== email) }))}
                      className="text-slate-400 hover:text-red-500 transition">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">Alert Toggles</p>
              {[
                { key: 'domainAlerts', label: 'Domain Expiry Alerts', desc: 'Get notified when domains are expiring' },
                { key: 'amcAlerts', label: 'AMC Renewal Alerts', desc: 'Get notified when AMC contracts are expiring' },
                { key: 'systemAlerts', label: 'System Alerts', desc: 'Important system notifications' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifConfig((c: any) => ({ ...c, [key]: !c[key] }))}
                    className={cn(
                      'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                      notifConfig[key] ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    )}
                  >
                    <span className={cn(
                      'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      notifConfig[key] ? 'translate-x-4' : 'translate-x-0'
                    )} />
                  </button>
                </div>
              ))}
            </div>

            <Button onClick={saveNotifications} loading={loading}>Save Notification Settings</Button>
          </div>
        </Card>
      )}

      {/* User Modal */}
      {userModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setUserModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{editUser ? 'Edit User' : 'Add User'}</h2>
              <button onClick={() => setUserModal(false)} className="text-slate-400 hover:text-slate-600 transition text-xl">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <AlertBanner type="error" message={error} />}
              <FormField label="Full Name" required>
                <Input value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" />
              </FormField>
              <FormField label="Email" required>
                <Input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@formium.in" />
              </FormField>
              <FormField label={editUser ? 'New Password (leave blank to keep)' : 'Password'} required={!editUser}>
                <Input type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
              </FormField>
              <FormField label="Role">
                <Select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </Select>
              </FormField>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setUserModal(false)}>Cancel</Button>
                <Button onClick={saveUser} loading={savingUser}>{editUser ? 'Save Changes' : 'Create User'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete user confirm */}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteUserId(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">Delete User</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">Are you sure? This user will lose all access.</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteUserId(null)}>Cancel</Button>
              <Button variant="danger" onClick={deleteUser}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
