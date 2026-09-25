import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase_server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get('page') ?? '1') || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? '20') || 20, 1), 50);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('tbl_notifications')
    .select(
      'id:notification_id, user_id, type, title:subject, message, is_read, related_id:booking_id, created_at:sent_at',
      { count: 'exact' },
    )
    .eq('user_id', auth.user.id)
    .order('sent_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Notifications query failed:', error);
    return NextResponse.json({ error: 'Could not load notifications.' }, { status: 500 });
  }

  return NextResponse.json({
    notifications: data ?? [],
    page,
    limit,
    total: count ?? 0,
    hasMore: (count ?? 0) > to + 1,
  });
}
