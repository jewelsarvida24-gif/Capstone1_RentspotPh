ALTER TABLE public.tbl_bookings
  ADD COLUMN IF NOT EXISTS agreement_image_path text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rental-agreements',
  'rental-agreements',
  false,
  12582912,
  ARRAY['image/png']
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Active admins can read rental agreements" ON storage.objects;
CREATE POLICY "Active admins can read rental agreements"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'rental-agreements'
    AND auth.jwt() ->> 'aal' = 'aal2'
    AND EXISTS (
      SELECT 1
      FROM public.staff_roles
      WHERE staff_roles.user_id = auth.uid()
        AND staff_roles.status = 'active'
        AND staff_roles.role IN ('admin', 'sysadmin')
    )
  );
