import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { name, email, password, role } = await request.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 })

  const hashed = await hashPassword(password)
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: role || 'MANAGER' },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  })

  return NextResponse.json(user, { status: 201 })
}
