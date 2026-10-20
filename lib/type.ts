// lib/types.ts
// Shared types for data coming from Supabase tables.
// Extend these as more columns/tables get used.

export interface RentalUnit {
  unit_id: string;
  id: string;
  unit_name: string;
  category: string | null;
  description: string | null;
  price_per_day: number | null;
  image_url: string | null;
  status: 'available' | 'unavailable' | string;
  avg_rating: number | null;
  created_at?: string;
}

export type UserRole = 'customer' | 'admin' | 'sysadmin';

export interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address?: string;
  date_of_birth?: string;
  role: UserRole;
}
