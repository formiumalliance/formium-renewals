import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all auth endpoints, static files, cron
  if (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/cron') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/login'
  ) {
    return NextResponse.next()
  }

  // Check token
  const token =
    request.cookies.get('auth_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const user = verifyToken(token)
  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.cookies.delete('auth_token')
    return res
  }

  // Admin-only routes
  if (
    (pathname.startsWith('/api/users') ||
      pathname.startsWith('/api/settings') ||
      pathname.startsWith('/dashboard/settings')) &&
    user.role !== 'ADMIN'
  ) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
