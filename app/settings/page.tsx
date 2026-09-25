import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase_server';
import SettingsClient from '@/components/settings/SettingsClient';
import RenterNavbar from '@/components/renter/renter-navbar';
import Footer from '@/components/layout/footer';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const requestedSection = (await searchParams).section;
  if (!requestedSection || requestedSection === 'account') {
    redirect('/renter/profile');
  }

  const initialSection =
    requestedSection === 'security' ? 'security' : 'notifications';

  const { data: profile } = await supabase
    .from('tbl_users')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <>
      <RenterNavbar
        firstName={profile?.first_name ?? undefined}
        lastName={profile?.last_name ?? undefined}
      />
      <SettingsClient
        userId={user.id}
        authEmail={user.email ?? ''}
        initialProfile={profile ?? {}}
        initialSection={initialSection}
      />
      <Footer />
    </>
  );
}
