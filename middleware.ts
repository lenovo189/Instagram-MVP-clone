import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  console.log(`[Middleware] Path: ${path}, User: ${user?.email || 'None'}`);

  const protectedRoutes = ['/home', '/profile', '/search'];
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

  if (!user && isProtectedRoute) {
    console.log(`[Middleware] Redirecting unauthenticated user from ${path} to /signin`);
    const url = new URL('/signin', request.url);
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  // If user is logged in and tries to access signin/signup, redirect to home
  const authRoutes = ['/signin', '/signup'];
  if (user && authRoutes.includes(path)) {
    console.log(`[Middleware] Redirecting authenticated user from ${path} to /home`);
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
