import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase_server';

export async function PATCH() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { error } = await supabase
    .from('tbl_notifications')
    .update({ is_read: true })
    .eq('user_id', auth.user.id)
    .eq('is_read', false);

  if (error) {
    return NextResponse.json({ error: 'Could not mark notifications as read.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
