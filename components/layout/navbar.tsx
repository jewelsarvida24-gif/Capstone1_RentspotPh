'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LogOut, Menu, Settings, X } from 'lucide-react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase_client';
import NotificationBell from '@/components/notifications/NotificationBell';

const navLinks = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'browse', label: 'Browse', href: '/guest/browse' },
  { id: 'faqs', label: 'FAQs', href: '/#faqs' },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;
    const loadAuthState = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (mounted) {
        setIsAuthenticated(Boolean(user));
        if (user) {
          const { data: profile } = await supabase
            .from('tbl_users')
            .select('first_name, last_name')
            .eq('user_id', user.id)
            .maybeSingle();
          const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
          setDisplayName(name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Renter');
        } else {
          setDisplayName('');
        }
        setIsLoadingAuth(false);
      }
    };
    void loadAuthState();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (mounted) {
          setIsAuthenticated(Boolean(session?.user));
          if (!session?.user) setDisplayName('');
        }
      },
    );
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsSettingsMenuOpen(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return;
    setIsAuthenticated(false);
    setDisplayName('');
    window.location.replace('/');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link href="/" className="z-50 shrink-0"><img src="/images/rentspot-logo.png" alt="RentSpotPH Logo" className="h-7 w-auto object-contain" /></Link>
          <div className="hidden items-center gap-8 text-sm font-semibold md:flex">
            {navLinks.map((link) => <Link key={link.id} href={link.href} className="text-slate-800 transition hover:text-blue-600">{link.label}</Link>)}
          </div>
          {!isLoadingAuth && (
            <div className="hidden items-center gap-3 md:flex">
              {isAuthenticated ? (
                <>
                  <NotificationBell />
                  <div className="relative">
                    <button type="button" onClick={() => setIsSettingsMenuOpen((value) => !value)} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" aria-expanded={isSettingsMenuOpen}><Settings size={18} />Settings</button>
                    {isSettingsMenuOpen && <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-lg">
                      <div className="border-b border-slate-100 px-3 pb-3 pt-2">
                        <p className="truncate font-semibold text-slate-900">{displayName}</p>
                      </div>
                      <Link href="/settings?section=account" className="block rounded-lg px-3 py-2 hover:bg-slate-50">Account</Link>
                      <Link href="/settings?section=notifications" className="block rounded-lg px-3 py-2 hover:bg-slate-50">Notification settings</Link>
                      <Link href="/renter/my-rentals" className="block rounded-lg px-3 py-2 hover:bg-slate-50">My Rentals</Link>
                      <button type="button" onClick={() => void handleLogout()} className="mt-1 flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 pt-3 text-left text-red-600"><LogOut size={16} />Log out</button>
                    </div>}
                  </div>
                </>
              ) : <><Link href="/auth/login" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600">Log in</Link><Link href="/auth/register" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">Sign up</Link></>}
            </div>
          )}
          <button type="button" className="rounded-lg p-2 text-slate-800 md:hidden" onClick={() => setIsMobileMenuOpen((value) => !value)} aria-label="Toggle Menu" aria-expanded={isMobileMenuOpen}>{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
      </nav>
      {isMobileMenuOpen && <div className="fixed inset-0 z-40 flex h-screen flex-col gap-5 overflow-y-auto bg-white px-6 pt-24 md:hidden">
        {isAuthenticated && <div className="border-b border-slate-100 pb-5">
          <p className="font-semibold text-slate-900">{displayName}</p>
          <div className="mt-4 flex items-center gap-4"><NotificationBell /><Link href="/settings" onClick={closeMobileMenu} className="font-semibold text-slate-700">Settings</Link></div>
        </div>}
        {navLinks.map((link) => <Link key={link.id} href={link.href} onClick={closeMobileMenu} className="border-b border-slate-100 pb-4 text-xl font-semibold">{link.label}</Link>)}
        {!isAuthenticated && !isLoadingAuth && <><Link href="/auth/login" onClick={closeMobileMenu} className="rounded-xl border border-slate-300 py-3 text-center font-semibold">Log in</Link><Link href="/auth/register" onClick={closeMobileMenu} className="rounded-xl bg-blue-600 py-3 text-center font-semibold text-white">Sign up</Link></>}
        {isAuthenticated && <button type="button" onClick={() => void handleLogout()} className="flex items-center gap-2 font-semibold text-red-600"><LogOut size={18} />Log out</button>}
      </div>}
    </>
  );
}
