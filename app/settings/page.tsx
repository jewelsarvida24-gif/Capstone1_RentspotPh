import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase_server';
import SettingsClient from '@/components/settings/SettingsClient';
import Navbar from '@/components/layout/navbar';
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
  const initialSection =
    requestedSection === 'notifications' || requestedSection === 'security'
      ? requestedSection
      : 'account';

  const { data: profile } = await supabase
    .from('tbl_users')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <>
      <Navbar />
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
