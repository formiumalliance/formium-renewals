import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { fetchWhoisData } from '@/lib/whois'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')

  if (!domain) return NextResponse.json({ error: 'Domain parameter required' }, { status: 400 })

  const result = await fetchWhoisData(domain)
  return NextResponse.json(result)
}
