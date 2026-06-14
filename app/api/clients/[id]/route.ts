import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      domains: { orderBy: { expiryDate: 'asc' } },
      amcContracts: { orderBy: { expiryDate: 'asc' } },
      activities: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const body = await request.json()
  const { name, companyName, email, phone, notes } = body

  const client = await prisma.client.update({
    where: { id },
    data: { name, companyName, email, phone, notes },
  })

  return NextResponse.json(client)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params

  await prisma.client.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
