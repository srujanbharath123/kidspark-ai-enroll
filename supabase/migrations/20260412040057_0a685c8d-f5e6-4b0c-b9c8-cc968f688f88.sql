
-- Add photo_url column to children table
ALTER TABLE public.children ADD COLUMN photo_url text;

-- Create storage bucket for child photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('child-photos', 'child-photos', true);

-- Allow anyone to view child photos
CREATE POLICY "Child photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'child-photos');

-- Allow authenticated users to upload child photos
CREATE POLICY "Authenticated users can upload child photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'child-photos');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update child photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'child-photos');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete child photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'child-photos');
