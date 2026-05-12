import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value

  const isDashboard = pathname.startsWith('/dashboard')
  const isAdmin = pathname.startsWith('/admin')
  const isLogin = pathname === '/login'

  if ((isDashboard || isAdmin) && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLogin && token) {
    return NextResponse.redirect(new URL('/dashboard/training', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
}
