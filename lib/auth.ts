import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  name: string
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function getAuthUser(request: NextRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('auth_token')?.value

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : cookieToken

  if (!token) return null
  return verifyToken(token)
}

export async function requireAuth(request: NextRequest, requiredRole?: string) {
  const user = await getAuthUser(request)
  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }
  if (requiredRole && user.role !== requiredRole) {
    return { error: 'Forbidden', status: 403 }
  }
  return { user }
}

export async function requireAdmin(request: NextRequest) {
  return requireAuth(request, 'ADMIN')
}
