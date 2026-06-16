import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Completely skip for these paths
  if (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/login' ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // For API routes only — check token
  if (pathname.startsWith('/api/')) {
    const token =
      request.cookies.get('auth_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (
      (pathname.startsWith('/api/users') || pathname.startsWith('/api/settings')) &&
      user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.next()
  }

  // All page routes — let dashboard/layout.tsx handle auth client-side
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
