import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getAmcStatus } from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  const amc = await prisma.amcContract.findUnique({
    where: { id },
    include: { client: { select: { id: true, name: true, companyName: true } } },
  })
  if (!amc) return NextResponse.json({ error: 'AMC not found' }, { status: 404 })
  return NextResponse.json(amc)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  const body = await request.json()
  const { amcType, customType, startDate, expiryDate, amount, paymentStatus, notes, action } = body

  // Handle renew action
  if (action === 'renew' && expiryDate) {
    const existing = await prisma.amcContract.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'AMC not found' }, { status: 404 })

    const status = getAmcStatus(expiryDate)
    const amc = await prisma.amcContract.update({
      where: { id },
      data: {
        expiryDate: new Date(expiryDate),
        startDate: startDate ? new Date(startDate) : existing.startDate,
        status,
        paymentStatus: paymentStatus || existing.paymentStatus,
      },
    })

    await prisma.activityLog.create({
      data: {
        clientId: existing.clientId,
        activityType: 'AMC_RENEWED',
        description: `AMC contract renewed until ${new Date(expiryDate).toLocaleDateString()}`,
      },
    })

    return NextResponse.json(amc)
  }

  const status = expiryDate ? getAmcStatus(expiryDate) : undefined

  const amc = await prisma.amcContract.update({
    where: { id },
    data: {
      amcType,
      customType,
      startDate: startDate ? new Date(startDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      amount: amount !== undefined ? parseFloat(amount) : undefined,
      paymentStatus,
      notes,
      ...(status ? { status } : {}),
    },
    include: { client: { select: { id: true, name: true } } },
  })

  return NextResponse.json(amc)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await params
  await prisma.amcContract.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
