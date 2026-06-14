import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getDomainStatus } from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  const domain = await prisma.domain.findUnique({
    where: { id },
    include: { client: { select: { id: true, name: true, companyName: true } } },
  })
  if (!domain) return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
  return NextResponse.json(domain)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  const body = await request.json()
  const { domainName, registrar, purchaseDate, creationDate, expiryDate, autoRenew, domainCost, loginUrl, notes } = body

  const status = expiryDate ? getDomainStatus(expiryDate) : undefined

  const domain = await prisma.domain.update({
    where: { id },
    data: {
      domainName,
      registrar,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      creationDate: creationDate ? new Date(creationDate) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      autoRenew,
      domainCost: domainCost ? parseFloat(domainCost) : null,
      loginUrl,
      notes,
      ...(status ? { status } : {}),
    },
    include: { client: { select: { id: true, name: true } } },
  })

  return NextResponse.json(domain)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  await prisma.domain.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
