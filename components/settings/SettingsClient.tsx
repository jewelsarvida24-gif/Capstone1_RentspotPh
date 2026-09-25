'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  CircleUserRound,
  Mail,
  MapPin,
  Pencil,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react';
import { createClient } from '@/lib/supabase_client';

type Profile = Record<string, unknown> & {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  address?: string | null;
  role?: string | null;
  created_at?: string | null;
  verification_status?: string | null;
  kyc_status?: string | null;
  avatar_url?: string | null;
};

type Preferences = {
  booking_updates: boolean;
  payment_updates: boolean;
  verification_updates: boolean;
  rental_reminders: boolean;
  promotions: boolean;
};

const defaultPreferences: Preferences = {
  booking_updates: true,
  payment_updates: true,
  verification_updates: true,
  rental_reminders: true,
  promotions: false,
};

const notificationOptions: Array<{
  key: keyof Preferences;
  title: string;
  description: string;
}> = [
  { key: 'booking_updates', title: 'Booking Updates', description: 'Confirmations, approvals, and changes to your bookings' },
  { key: 'payment_updates', title: 'Payment Updates', description: 'Payment receipts and reminders' },
  { key: 'verification_updates', title: 'Verification Updates', description: 'Status updates for your renter verification' },
  { key: 'rental_reminders', title: 'Rental Reminders', description: 'Reminders before your pickup or return date' },
  { key: 'promotions', title: 'Promotions', description: 'Special offers and new unit announcements' },
];

function value(profile: Profile, key: keyof Profile, fallback = '') {
  const item = profile[key];
  return typeof item === 'string' ? item : fallback;
}

function formatDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? 'Not available'
    : parsed.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
}

function statusLabel(status: string) {
  return status.replace(/[_-]/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function SettingsClient({
  userId,
  authEmail,
  initialProfile,
  initialSection = 'account',
}: {
  userId: string;
  authEmail: string;
  initialProfile: Profile;
  initialSection?: 'account' | 'notifications' | 'security';
}) {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', address: '' });
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreference, setSavingPreference] = useState<keyof Preferences | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ email: authEmail, phone: '' });
  const [savingContact, setSavingContact] = useState(false);

  const [activeSection, setActiveSection] = useState<'account' | 'notifications' | 'security'>(initialSection);

  const firstName = value(profile, 'first_name');
  const lastName = value(profile, 'last_name');
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Renter';
  const email = value(profile, 'email', authEmail) || authEmail;
  const role = value(profile, 'role', 'customer');
  const verification = value(profile, 'verification_status', value(profile, 'kyc_status', 'pending')).toLowerCase();
  const avatar = value(profile, 'avatar_url');

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    setContactForm({
      email,
      phone: value(profile, 'phone_number'),
    });
  }, [email, profile]);

  useEffect(() => {
    setForm({
      firstName,
      lastName,
      phone: value(profile, 'phone_number'),
      address: value(profile, 'address'),
    });
  }, [firstName, lastName, profile]);

  useEffect(() => {
    let active = true;
    async function loadPreferences() {
      const { data, error: preferenceError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!active) return;
      if (preferenceError) {
        setError('Notification preferences need the Supabase migration before they can be saved.');
      } else if (data) {
        setPreferences({ ...defaultPreferences, ...data });
      }
      setLoadingPreferences(false);
    }
    void loadPreferences();
    return () => {
      active = false;
    };
  }, [supabase, userId]);

  const togglePreference = async (key: keyof Preferences) => {
    const nextValue = !preferences[key];
    setSavingPreference(key);
    setError('');
    const next = { ...preferences, [key]: nextValue };
    const { error: saveError } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: userId, ...next }, { onConflict: 'user_id' });

    if (saveError) {
      setError(`Could not save ${notificationOptions.find((option) => option.key === key)?.title.toLowerCase() ?? 'notification'} preference.`);
    } else {
      setPreferences(next);
      setMessage('Notification preferences saved.');
    }
    setSavingPreference(null);
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    setError('');
    const { data, error: saveError } = await supabase
      .from('tbl_users')
      .update({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone_number: form.phone.trim(),
        address: form.address.trim(),
      })
      .eq('user_id', userId)
      .select('*')
      .single();

    if (saveError) {
      setError(saveError.message);
    } else {
      setProfile((data ?? { ...profile, first_name: form.firstName, last_name: form.lastName, phone_number: form.phone, address: form.address }) as Profile);
      setEditing(false);
      setMessage('Profile updated successfully.');
    }
    setSavingProfile(false);
  };

  const saveContactDetails = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingContact(true);
    setError('');

    const { error: profileError } = await supabase
      .from('tbl_users')
      .update({ phone_number: contactForm.phone.trim() })
      .eq('user_id', userId);

    if (profileError) {
      setError(`Could not update phone number: ${profileError.message}`);
      setSavingContact(false);
      return;
    }

    if (contactForm.email.trim() !== email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: contactForm.email.trim() });
      if (emailError) {
        setError(`Could not update email address: ${emailError.message}`);
        setSavingContact(false);
        return;
      }
      setMessage('Phone number saved. Check your email to confirm the new email address.');
    } else {
      setMessage('Phone number saved.');
    }

    setProfile((current) => ({ ...current, phone_number: contactForm.phone.trim() }));
    setEditingContact(false);
    setSavingContact(false);
  };

  return (
    <main className="min-h-screen bg-[#fbfdff] px-4 py-10 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1100px]">
        <Link href="/renter/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600">
          ← Back to dashboard
        </Link>

        {message && <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><Check className="h-4 w-4" />{message}</div>}
        {error && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>}

        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside>
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#8190a5]">Profile sections</p>
            <nav className="rounded-2xl border border-white/80 bg-white/80 p-2 shadow-sm backdrop-blur">
              <Link href="/settings?section=account" className={`block rounded-lg px-3 py-2.5 text-sm font-semibold ${activeSection === 'account' ? 'bg-[#e7f0fc] text-[#214f94]' : 'text-[#68778c] hover:bg-[#f8fbff]'}`}>Profile</Link>
              <Link href="/settings?section=notifications" className={`block rounded-lg px-3 py-2.5 text-sm font-semibold ${activeSection === 'notifications' ? 'bg-[#e7f0fc] text-[#214f94]' : 'text-[#68778c] hover:bg-[#f8fbff]'}`}>Notifications</Link>
              <Link href="/settings?section=security" className={`block rounded-lg px-3 py-2.5 text-sm font-semibold ${activeSection === 'security' ? 'bg-[#e7f0fc] text-[#214f94]' : 'text-[#68778c] hover:bg-[#f8fbff]'}`}>Security</Link>
            </nav>
          </aside>
          <section className="min-w-0 rounded-[30px] border border-white/80 bg-white/85 shadow-[0_20px_70px_rgba(37,99,235,0.08)] backdrop-blur-2xl">
            {activeSection === 'account' && (
              <div>
                <SectionHeader title="Profile" description="Your renter profile and account information." />
                <div className="flex flex-col gap-5 border-b border-[#eeeae4] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                  <div className="flex items-center gap-4">
                    {avatar ? <img src={avatar} alt="" className="h-14 w-14 rounded-full object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dce9fb] font-serif text-xl font-semibold text-[#214f94]">{fullName.charAt(0).toUpperCase()}</div>}
                    <div><h2 className="font-serif text-xl font-semibold text-[#152c4a]">{fullName}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-[#748096]"><Mail className="h-3.5 w-3.5" />{email}</p></div>
                  </div>
                  <button type="button" onClick={() => setEditing(!editing)} className="btn-secondary inline-flex items-center justify-center gap-2 self-start text-sm"><Pencil className="h-4 w-4" />{editing ? 'Cancel' : 'Edit profile'}</button>
                </div>
                {editing ? (
                  <form onSubmit={saveProfile} className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-8">
                    <label className="text-sm font-medium text-[#536176]">First name<input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className="input-field mt-2" /></label>
                    <label className="text-sm font-medium text-[#536176]">Last name<input required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className="input-field mt-2" /></label>
                    <label className="text-sm font-medium text-[#536176]">Phone number<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="input-field mt-2" /></label>
                    <label className="text-sm font-medium text-[#536176] sm:col-span-2">Address<textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="input-field mt-2 min-h-24 resize-y" /></label>
                    <div className="sm:col-span-2"><button disabled={savingProfile} className="btn-primary">{savingProfile ? 'Saving...' : 'Save changes'}</button></div>
                  </form>
                ) : (
                  <div className="divide-y divide-[#eeeae4]">
                    <SettingRow label="Phone number" value={value(profile, 'phone_number', 'Not provided')} icon={Smartphone} />
                    <SettingRow label="Address" value={value(profile, 'address', 'Not provided')} icon={MapPin} />
                    <SettingRow label="Email address" value={email} icon={Mail} />
                    <SettingRow label="Account role" value={role === 'customer' ? 'Renter' : statusLabel(role)} icon={CircleUserRound} />
                    <SettingRow label="Member since" value={formatDate(value(profile, 'created_at'))} icon={Check} />
                    <div className="flex items-start gap-3 px-6 py-4 sm:px-8"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#6e8fbe]" /><div><p className="text-sm font-medium text-[#34445c]">Verification status</p><p className="mt-1 text-sm text-[#748096]">{statusLabel(verification)} — {verification === 'verified' || verification === 'approved' ? 'You can continue renting units.' : 'Complete verification to help keep rentals secure.'}</p></div></div>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'notifications' && (
              <div>
                <SectionHeader title="Notification Settings" description="Choose the rental updates you want to receive." />
                <div className="divide-y divide-[#ddd9d1] px-6 sm:px-8">
                  {notificationOptions.map((option) => {
                    const enabled = preferences[option.key];
                    return (
                      <div key={option.key} className="flex items-center justify-between gap-5 py-5 first:pt-2">
                        <div>
                          <h2 className="text-sm font-semibold text-[#111827]">{option.title}</h2>
                          <p className="mt-1 text-xs leading-5 text-[#6f6470] sm:text-sm">{option.description}</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-label={`Turn ${option.title.toLowerCase()} ${enabled ? 'off' : 'on'}`}
                          aria-checked={enabled}
                          disabled={loadingPreferences || savingPreference === option.key}
                          onClick={() => void togglePreference(option.key)}
                          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${enabled ? 'bg-[#214a83]' : 'bg-[#e2e5ea]'} disabled:cursor-wait disabled:opacity-60`}
                        >
                          <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ${enabled ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div>
                <SectionHeader title="Security" description="Keep your RentSpotPH account protected." />
                <div className="divide-y divide-[#eeeae4]">
                  <div className="px-6 py-5 sm:px-8">
                    {editingContact ? (
                      <form onSubmit={saveContactDetails} className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm font-medium text-[#536176]">Email address<input type="email" required value={contactForm.email} onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })} className="input-field mt-2" /></label>
                        <label className="text-sm font-medium text-[#536176]">Phone number<input value={contactForm.phone} onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })} className="input-field mt-2" /></label>
                        <div className="flex gap-3 sm:col-span-2"><button disabled={savingContact} className="btn-primary text-sm">{savingContact ? 'Saving...' : 'Save contact details'}</button><button type="button" onClick={() => setEditingContact(false)} className="btn-secondary text-sm">Cancel</button></div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between gap-5">
                        <div><h2 className="text-sm font-semibold text-[#25334a]">Email and phone</h2><p className="mt-1 text-sm text-[#748096]">{email} · {value(profile, 'phone_number', 'Phone not provided')}</p></div>
                        <button type="button" onClick={() => setEditingContact(true)} className="btn-secondary text-sm">Change</button>
                      </div>
                    )}
                  </div>
                  <SettingAction title="Change password" description="Request a secure password reset link for this account." href="/auth/forgot-password" />
                  <div className="flex items-center justify-between gap-5 px-6 py-5 sm:px-8"><div><h2 className="text-sm font-semibold text-[#25334a]">Sign out</h2><p className="mt-1 text-sm text-[#748096]">End your current RentSpotPH session on this device.</p></div><button type="button" onClick={async () => { const { error: signOutError } = await supabase.auth.signOut(); if (!signOutError) window.location.replace('/'); }} className="btn-secondary text-sm">Log out</button></div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return <div className="border-b border-[#eeeae4] px-6 py-6 sm:px-8"><h2 className="font-serif text-2xl font-semibold text-[#152c4a]">{title}</h2><p className="mt-1 text-sm text-[#748096]">{description}</p></div>;
}

function SettingRow({ icon: Icon, label, value: rowValue }: { icon: typeof UserRound; label: string; value: string }) {
  return <div className="flex items-center gap-3 px-6 py-4 sm:px-8"><Icon className="h-4 w-4 shrink-0 text-[#6e8fbe]" /><div><p className="text-xs text-[#8a96a8]">{label}</p><p className="mt-0.5 text-sm font-medium text-[#34445c]">{rowValue}</p></div></div>;
}

function SettingAction({ title, description, href }: { title: string; description: string; href: string }) {
  return <Link href={href} className="flex items-center justify-between gap-5 px-6 py-5 transition hover:bg-[#f8fbff] sm:px-8"><div><h2 className="text-sm font-semibold text-[#25334a]">{title}</h2><p className="mt-1 text-sm text-[#748096]">{description}</p></div><span className="text-sm font-semibold text-[#315f9f]">Open</span></Link>;
}
