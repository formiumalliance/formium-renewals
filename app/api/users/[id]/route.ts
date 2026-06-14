import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, hashPassword } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const { name, email, password, role, isActive } = await request.json()

  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (email !== undefined) updateData.email = email
  if (role !== undefined) updateData.role = role
  if (isActive !== undefined) updateData.isActive = isActive
  if (password) updateData.password = await hashPassword(password)

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  })

  return NextResponse.json(user)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  // Prevent deleting yourself
  if (auth.user.userId === id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
