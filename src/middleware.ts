import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { FAMILY_SESSION_COOKIE, verifyFamilySessionToken } from '@/lib/auth/familySession';

const PUBLIC_PATHS = new Set(['/login', '/admin/login']);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = !!user;

  // Administratorområdet: kræver aktiv admin-session.
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!isAdmin) {
      const redirectUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  // Familiekalenderen (forsiden): kræver enten admin-session eller gyldig
  // familie-adgangskode-cookie.
  if (!PUBLIC_PATHS.has(pathname) && !pathname.startsWith('/api') && !pathname.startsWith('/admin')) {
    if (isAdmin) return response;

    const familyCookie = request.cookies.get(FAMILY_SESSION_COOKIE)?.value;
    const hasFamilyAccess = await verifyFamilySessionToken(familyCookie);
    if (!hasFamilyAccess) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Kør på alle stier undtagen statiske filer, billeder og PWA-assets.
     * "images/" skal også undtages – ellers bliver Next.js' interne
     * billedoptimering (som selv henter kildefilen via en HTTP-forespørgsel)
     * blokeret af login-tjekket og returnerer en login-omdirigering i
     * stedet for selve billedet.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|images/).*)',
  ],
};
