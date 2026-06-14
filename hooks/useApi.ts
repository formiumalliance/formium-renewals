import { useAuth } from '@/contexts/AuthContext'
import { useCallback } from 'react'

export function useApi() {
  const { token } = useAuth()

  const request = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(path, { ...options, headers })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || `Request failed: ${res.status}`)
      }
      return data
    },
    [token]
  )

  return {
    get: (path: string) => request(path),
    post: (path: string, body: unknown) => request(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path: string, body: unknown) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (path: string) => request(path, { method: 'DELETE' }),
    download: async (path: string, filename: string) => {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(path, { headers })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    },
  }
}
