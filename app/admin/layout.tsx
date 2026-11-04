import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import AdminNav from '@/components/admin/AdminNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If this is the login route, let it render without the dashboard frame
  // Note: App Router nested layouts apply to all subroutes, but we can detect if no user
  // Or handle in AdminNav
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <div className="min-h-screen bg-neutral-100/60 dark:bg-neutral-950 flex flex-col">
      {user && profile && (
        <AdminNav user={user} profile={profile} />
      )}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
