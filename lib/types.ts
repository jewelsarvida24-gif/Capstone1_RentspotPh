export interface RentalUnit {
  unit_id: string | number;
  unit_name: string;
  category?: string | null;
  status?: string | null;
  description?: string | null;
  image_url?: string | null;
  price_per_day?: number | null;
  avg_rating?: number | null;
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
