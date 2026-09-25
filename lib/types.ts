export interface RentalUnit {
  unit_id: string | number;
  unit_name: string;
  category?: string | null;
  status?: string | null;
  description?: string | null;
  image_url?: string | null;
  price_per_day?: number | null;
  avg_rating?: number | null;
  reviews_count?: number | null;
  location?: string | null;
  [key: string]: unknown;
}

export interface BookingRequest {
  unit_id: string | number;
  start_date: string;
  end_date: string;
  notes?: string;
  customer_name?: string;
  customer_email?: string;
}

export interface RentalBooking {
  booking_id: string | number;
  unit_id: string | number;
  user_id?: string;
  start_date: string;
  end_date: string;
  total_days?: number | null;
  total_amount?: number | null;
  notes?: string | null;
  booking_status: string;
  created_at?: string | null;
  tbl_units?: RentalUnit | null;
  rating?: number | null;
  review?: string | null;
}
