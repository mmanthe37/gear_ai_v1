-- =============================================
-- Storage Buckets and Policies for Photo Uploads
-- =============================================
-- Created: 2025-01-15
-- Purpose: Create storage buckets for vehicle photos and maintenance receipts
--          with appropriate RLS policies

-- =============================================
-- 1. Create Storage Buckets
-- =============================================

-- Vehicle Photos Bucket
-- Public read access, authenticated users can upload to their own vehicles
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-photos',
  'vehicle-photos',
  true, -- Public read access
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Maintenance Receipts Bucket
-- Private access, only owners can read/write
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'maintenance-receipts',
  'maintenance-receipts',
  false, -- Private access
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. Storage Policies for Vehicle Photos
-- =============================================

-- Policy: Authenticated users can upload vehicle photos
CREATE POLICY "Users can upload vehicle photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-photos' AND
  -- Extract vehicle_id from filename (format: {vehicle_id}_{timestamp}.jpg)
  -- and verify user owns the vehicle
  EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicle_id::text = SPLIT_PART(name, '_', 1)
    AND user_id = auth.uid()
  )
);

-- Policy: Anyone can view vehicle photos (public bucket)
CREATE POLICY "Public read access to vehicle photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'vehicle-photos');

-- Policy: Users can delete their own vehicle photos
CREATE POLICY "Users can delete their vehicle photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-photos' AND
  EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicle_id::text = SPLIT_PART(name, '_', 1)
    AND user_id = auth.uid()
  )
);

-- Policy: Users can update their own vehicle photos
CREATE POLICY "Users can update their vehicle photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicle-photos' AND
  EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicle_id::text = SPLIT_PART(name, '_', 1)
    AND user_id = auth.uid()
  )
);

-- =============================================
-- 3. Storage Policies for Maintenance Receipts
-- =============================================

-- Policy: Authenticated users can upload maintenance receipts
CREATE POLICY "Users can upload maintenance receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'maintenance-receipts' AND
  -- Extract record_id from filename and verify user owns the vehicle
  EXISTS (
    SELECT 1 FROM maintenance_records mr
    JOIN vehicles v ON v.vehicle_id = mr.vehicle_id
    WHERE mr.record_id::text = SPLIT_PART(name, '_', 1)
    AND v.user_id = auth.uid()
  )
);

-- Policy: Users can view their own maintenance receipts
CREATE POLICY "Users can view their maintenance receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'maintenance-receipts' AND
  EXISTS (
    SELECT 1 FROM maintenance_records mr
    JOIN vehicles v ON v.vehicle_id = mr.vehicle_id
    WHERE mr.record_id::text = SPLIT_PART(name, '_', 1)
    AND v.user_id = auth.uid()
  )
);

-- Policy: Users can delete their own maintenance receipts
CREATE POLICY "Users can delete their maintenance receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'maintenance-receipts' AND
  EXISTS (
    SELECT 1 FROM maintenance_records mr
    JOIN vehicles v ON v.vehicle_id = mr.vehicle_id
    WHERE mr.record_id::text = SPLIT_PART(name, '_', 1)
    AND v.user_id = auth.uid()
  )
);

-- Policy: Users can update their own maintenance receipts
CREATE POLICY "Users can update their maintenance receipts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'maintenance-receipts' AND
  EXISTS (
    SELECT 1 FROM maintenance_records mr
    JOIN vehicles v ON v.vehicle_id = mr.vehicle_id
    WHERE mr.record_id::text = SPLIT_PART(name, '_', 1)
    AND v.user_id = auth.uid()
  )
);

-- =============================================
-- 4. Comments for Documentation
-- =============================================

COMMENT ON POLICY "Users can upload vehicle photos" ON storage.objects IS
  'Allows authenticated users to upload photos for vehicles they own';

COMMENT ON POLICY "Public read access to vehicle photos" ON storage.objects IS
  'Allows public read access to vehicle photos for sharing and display';

COMMENT ON POLICY "Users can upload maintenance receipts" ON storage.objects IS
  'Allows authenticated users to upload receipts for their maintenance records';

COMMENT ON POLICY "Users can view their maintenance receipts" ON storage.objects IS
  'Allows users to view only their own maintenance receipt photos';
