'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { siteConfig } from '@/lib/site-config';
import {
  Newspaper,
  PlusCircle,
  FileText,
  FolderTree,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminNavProps {
  user: any;
  profile: any;
}

export default function AdminNav({ user, profile }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If on login page, do not show admin nav
  if (pathname === '/admin/login') return null;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
    router.push('/admin/login');
    router.refresh();
  };

  const navLinks = [
    {
      name: 'All Articles',
      href: '/admin',
      icon: FileText,
      active: pathname === '/admin',
    },
    {
      name: 'Categories',
      href: '/admin/categories',
      icon: FolderTree,
      active: pathname === '/admin/categories',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Editorial Desk */}
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/20 group-hover:scale-105 transition-transform">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif font-bold text-lg text-neutral-900 dark:text-white tracking-tight">
                  {siteConfig.name}
                </span>
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                  DESK
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      item.active
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right actions: New Article button, live site, user badge, sign out */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/admin/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              New Article
            </Link>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors border border-neutral-200 dark:border-neutral-800"
              title="View Public Site in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Site
            </Link>

            <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-800" />

            <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-medium capitalize">
                <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                {profile?.role || 'editor'}
              </span>
              <span className="text-neutral-400 truncate max-w-[150px]">
                {user?.email}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-neutral-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/admin/new"
              className="p-2 rounded-lg bg-red-600 text-white shadow-sm"
              title="New Article"
            >
              <PlusCircle className="w-5 h-5" />
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <div className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                    item.active
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-red-600 font-semibold'
                      : 'text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="truncate">{user?.email}</span>
              <span className="capitalize px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-700 dark:text-neutral-300">
                {profile?.role}
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <Link
                href="/"
                target="_blank"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Site
              </Link>
              <button
                onClick={handleSignOut}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

