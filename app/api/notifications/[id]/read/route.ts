import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase_server';

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { id } = await params;
  const { data, error } = await supabase
    .from('tbl_notifications')
    .update({ is_read: true })
    .eq('notification_id', id)
    .eq('user_id', auth.user.id)
    .select('notification_id');

  if (error) {
    return NextResponse.json({ error: 'Could not mark notification as read.' }, { status: 500 });
  }
  // RLS or a wrong id updates 0 rows without an error, so check explicitly
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}