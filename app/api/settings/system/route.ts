import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const settings = await prisma.settings.findMany()
  const result: Record<string, string> = {}
  settings.forEach((s: { key: string; value: string }) => { result[s.key] = s.value })
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()

  // Upsert each setting
  const updates = Object.entries(body).map(([key, value]) =>
    prisma.settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
  )

  await Promise.all(updates)
  return NextResponse.json({ success: true })
}
