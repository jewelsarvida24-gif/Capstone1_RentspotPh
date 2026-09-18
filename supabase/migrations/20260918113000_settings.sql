-- RentSpotPH settings data for renter profiles and notification preferences.
alter table public.tbl_users
  add column if not exists address text,
  add column if not exists avatar_url text,
  add column if not exists verification_status text not null default 'pending';

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  booking_updates boolean not null default true,
  payment_updates boolean not null default true,
  verification_updates boolean not null default true,
  rental_reminders boolean not null default true,
  promotions boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.notification_preferences enable row level security;

create policy "Users can view their notification preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their notification preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their notification preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
