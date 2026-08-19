// app/admin/page.tsx
import Link from 'next/link';
import { Shield, Lock } from 'lucide-react';

export default function AdminLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8" />
        </div>
        
        <h1 className="text-4xl font-bold mb-2">Admin Portal</h1>
        <p className="text-brand-100 mb-8">Manage RentSpot.ph operations and users</p>
        
        <div className="space-y-3">
          <Link 
            href="/admin/auth/login"
            className="block bg-white text-brand-600 font-semibold px-6 py-3 rounded-lg hover:bg-brand-50 transition"
          >
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              Admin Sign In
            </div>
          </Link>
          
          <Link
            href="/admin/auth/register"
            className="block border-2 border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition"
          >
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              Create Admin Account
            </div>
          </Link>
        </div>
        
        <Link href="/" className="text-brand-100 hover:text-white mt-6 inline-block text-sm">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
