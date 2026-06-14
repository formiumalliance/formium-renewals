import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow cron endpoint with Bearer token (checked inside the route)
  if (pathname.startsWith('/api/cron')) {
    return NextResponse.next()
  }

  // For API routes: check Authorization header or cookie
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

  // Admin-only route guard
  const ADMIN_PATHS = ['/api/users', '/api/settings', '/dashboard/settings']
  if (ADMIN_PATHS.some(p => pathname.startsWith(p)) && user.role !== 'ADMIN') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Inject user info into headers for API routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', user.userId)
  requestHeaders.set('x-user-role', user.role)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
