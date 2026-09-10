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
