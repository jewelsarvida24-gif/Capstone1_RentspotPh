// components/layout/RoleBasedNavigation.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase_client';
import { Menu, X, LogOut, User, Settings, Shield } from 'lucide-react';

type AppUser = {
  first_name?: string | null;
  role: string;
};

export default function RoleBasedNavigation() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<AppUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from('tbl_users')
          .select('*')
          .eq('user_id', authUser.id)
          .single();
        setUser(data);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  // Navigation links based on role
  const getNavLinks = () => {
    const baseLinks = [
      { label: 'Browse', href: '/guest/browse', visible: true },
      { label: 'FAQs', href: '/faq', visible: true },
    ];

    if (!user) {
      return baseLinks;
    }

    const roleLinks: Record<string, any[]> = {
      'customer': [
        { label: 'My Rentals', href: '/renter/my-rentals', icon: '📦' },
        { label: 'KYC Verification', href: '/renter/kyc', icon: '🆔' },
        { label: 'Profile', href: '/renter/profile', icon: '👤' },
      ],
      'admin': [
        { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
        { label: 'Bookings', href: '/admin/booking', icon: '📅' },
        { label: 'Inventory', href: '/admin/inventory', icon: '📦' },
        { label: 'KYC Review', href: '/admin/kyc', icon: '✅' },
        { label: 'Users', href: '/admin/users', icon: '👥' },
      ],
      'sysadmin': [
        { label: 'Dashboard', href: '/sysadmin', icon: '⚙️' },
        { label: 'Manage Admins', href: '/sysadmin/manage-admins', icon: '👥' },
        { label: 'User Accounts', href: '/sysadmin/users', icon: '🔐' },
        { label: 'System Reports', href: '/sysadmin/reports', icon: '📊' },
        { label: 'Settings', href: '/sysadmin/settings', icon: '⚙️' },
      ],
    };

    return [...baseLinks, ...(roleLinks[user.role] || [])];
  };

  const navLinks = getNavLinks();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-bold text-xl text-brand-500 tracking-tight">
          RentSpot<span className="text-neutral-700">.ph</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-brand-500 transition text-neutral-600"
            >
              {link.icon ? `${link.icon} ${link.label}` : link.label}
            </Link>
          ))}
        </div>

        {/* User Menu & Logout */}
        <div className="flex items-center gap-4">
          {!loading && user && (
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900">
                  {user.first_name || 'User'}
                </p>
                <p className="text-xs text-neutral-500 capitalize">
                  {user.role === 'customer' ? 'Renter' : user.role}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {!user && !loading && (
            <div className="hidden md:flex gap-3">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-brand-600 font-medium hover:bg-brand-50 rounded-lg transition"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 hover:bg-neutral-100 rounded-lg"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-200 p-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium text-neutral-600 hover:text-brand-500 transition"
              onClick={() => setMenuOpen(false)}
            >
              {link.icon ? `${link.icon} ${link.label}` : link.label}
            </Link>
          ))}
          {user && (
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="w-full mt-4 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}
          {!user && !loading && (
            <div className="space-y-3 pt-4">
              <Link
                href="/auth/login"
                className="block w-full px-4 py-2 text-center text-brand-600 font-medium hover:bg-brand-50 rounded-lg transition"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="block w-full px-4 py-2 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition text-center"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
