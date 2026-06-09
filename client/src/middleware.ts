import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value

  const isDashboard = pathname.startsWith('/dashboard')
  const isAdmin = pathname.startsWith('/admin')
  const isLogin = pathname === '/login'
  // Клиент при «мёртвой» сессии редиректит на /login?session=expired —
  // в этом случае НЕ отбрасываем обратно на дашборд, иначе зацикливание.
  const sessionExpired = request.nextUrl.searchParams.has('session')

  if ((isDashboard || isAdmin) && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLogin && token && !sessionExpired) {
    return NextResponse.redirect(new URL('/dashboard/training', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
}
