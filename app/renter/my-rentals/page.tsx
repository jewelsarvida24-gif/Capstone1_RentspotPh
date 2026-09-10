// app/renter/my-rentals/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase_client';
import { LogOut } from 'lucide-react';

export default function MyRentalsPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Rentals</h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
        <div className="bg-white rounded-lg p-6 border border-neutral-200">
          <p className="text-neutral-600">Your rentals will appear here...</p>
        </div>
      </div>
    </div>
  );
}
