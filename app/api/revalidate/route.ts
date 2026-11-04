import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, secret } = body;

    // Optional secret token check or Supabase session check
    const revalidateSecret = process.env.REVALIDATION_SECRET;
    if (revalidateSecret && secret !== revalidateSecret) {
      // Check user session
      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(_cookiesToSet: Array<{ name: string; value: string; options?: any }>) {},
          },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
    }

    if (path) {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path, now: Date.now() });
    }

    // Default revalidate home
    revalidatePath('/');
    return NextResponse.json({ revalidated: true, path: '/', now: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
