import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase credentials are not configured yet, allow public access
    // but protect /admin routes with informative redirect
    if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('error', 'missing_env');
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: DO NOT remove auth.getUser() as it validates JWT securely.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Handle /admin paths
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';

    if (!user) {
      // Not logged in
      if (!isLoginPage) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/admin/login';
        redirectUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(redirectUrl);
      }
      return supabaseResponse;
    }

    // User is logged in, verify role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAuthorized = profile?.role === 'admin' || profile?.role === 'editor';

    if (isLoginPage) {
      if (isAuthorized) {
        // Already authenticated as admin/editor, go to dashboard
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/admin';
        return NextResponse.redirect(redirectUrl);
      }
      // Logged in but not authorized
      return supabaseResponse;
    }

    // Protected admin route
    if (!isAuthorized) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      redirectUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
