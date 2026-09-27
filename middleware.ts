import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create an unmodified response by default
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(keysToSet) {
          keysToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          keysToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This single call securely checks the user AND refreshes the auth token if needed
  const { data: { user } } = await supabase.auth.getUser()

  const currentPath = request.nextUrl.pathname;

  // 1. Define your protected routes (require login)
  const isProtectedRoute = currentPath.startsWith('/profile') || currentPath.startsWith('/settings');
  
  // 2. Define your auth routes (hide if already logged in)
  const isAuthRoute = currentPath.startsWith('/login') || currentPath.startsWith('/signup');

  // If they aren't logged in and try to access a private page, bounce them to login
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If they ARE logged in and try to access the login page, bounce them to the homepage
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

// This config tells Next.js to run this filter on every route EXCEPT static files/images
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}