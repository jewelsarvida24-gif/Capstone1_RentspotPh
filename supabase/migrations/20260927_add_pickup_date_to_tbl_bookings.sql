ALTER TABLE public.tbl_bookings
  ADD COLUMN IF NOT EXISTS pickup_date date;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tbl_bookings_pickup_date_within_rental_period'
      AND conrelid = 'public.tbl_bookings'::regclass
  ) THEN
    ALTER TABLE public.tbl_bookings
      ADD CONSTRAINT tbl_bookings_pickup_date_within_rental_period
      CHECK (
        pickup_date IS NULL
        OR (pickup_date >= start_date AND pickup_date <= end_date)
      );
  END IF;
END $$;