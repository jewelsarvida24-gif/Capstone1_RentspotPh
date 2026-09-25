import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase_server';

export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { count, error } = await supabase
    .from('tbl_notifications')
    .select('notification_id', { count: 'exact', head: true })
    .eq('user_id', auth.user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Unread notifications query failed:', error);
    return NextResponse.json({ error: 'Could not load unread count.' }, { status: 500 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
