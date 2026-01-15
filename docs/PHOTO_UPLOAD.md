# Photo Upload Functionality - Implementation Guide

## Overview

This implementation adds comprehensive photo upload capabilities to the Gear AI CoPilot app for:
- **Vehicle Photos**: Public photos of vehicles for sharing and display
- **Maintenance Receipt Photos**: Private photos of service receipts

## Features Implemented

### 1. Storage Service (`services/storage-service.ts`)

A complete service module for managing image uploads to Supabase Storage with the following capabilities:

#### Functions

- **`uploadVehiclePhoto(vehicleId, imageUri)`**: Uploads vehicle photos to the public "vehicle-photos" bucket
  - Validates image (max 5MB, JPEG/PNG only)
  - Compresses to max 1920px width at 85% quality
  - Generates unique filename: `{vehicleId}_{timestamp}.jpg`
  - Returns public URL

- **`uploadMaintenanceReceipt(recordId, imageUri)`**: Uploads receipts to the private "maintenance-receipts" bucket
  - Same validation and compression as vehicle photos
  - Returns signed URL (valid for 1 year) for private access
  - Generates unique filename: `{recordId}_{timestamp}.jpg`

- **`deleteImage(bucketName, filePath)`**: Deletes images from storage
  - Handles errors gracefully without throwing

- **`getImageUrl(bucketName, filePath)`**: Gets public URL for an image

#### Image Optimization

- **Compression**: Images are automatically compressed using `expo-image-manipulator`
- **Max Width**: 1920px (maintains aspect ratio)
- **Quality**: 85% JPEG quality
- **Typical Size**: Under 500KB after compression
- **Validation**: Max 5MB before upload, JPEG/PNG only

### 2. Supabase Storage Configuration

Migration file: `supabase/migrations/20250115000000_storage_buckets.sql`

#### Storage Buckets

1. **vehicle-photos**
   - Public read access
   - 5MB file size limit
   - Allowed MIME types: image/jpeg, image/png

2. **maintenance-receipts**
   - Private access (owner only)
   - 5MB file size limit
   - Allowed MIME types: image/jpeg, image/png

#### Row Level Security (RLS) Policies

**Vehicle Photos:**
- Users can upload photos for vehicles they own
- Public read access for all photos
- Users can delete/update their own vehicle photos

**Maintenance Receipts:**
- Users can upload receipts for their maintenance records
- Users can only view/delete their own receipts
- Private access enforced through RLS

Policy enforcement uses filename pattern: `{id}_{timestamp}.jpg` where the ID is extracted and verified against the database.

### 3. UI Integration

#### AddVehicleModal Component

Enhanced with photo upload capabilities:
- Camera and gallery selection via `expo-image-picker`
- Photo preview before upload
- Remove photo option
- Clean, intuitive UI

**Usage:**
```typescript
<AddVehicleModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  onAdd={(vehicle) => {
    // vehicle.photoUrl contains the local URI
    // In production: upload photo after creating vehicle in DB
  }}
/>
```

#### Maintenance Screen

Added service record creation with receipt photos:
- "Add Service Record" modal with photo upload
- Photo thumbnails on service cards
- Full-size photo viewer modal
- Tap to expand photos

**Features:**
- Add button in header to create new service records
- Photo selection from camera or gallery
- Photo preview and remove option
- Photo thumbnails displayed with service records
- Tap to view full-size photos

## Installation

The following dependencies have been added:

```json
{
  "expo-image-picker": "latest",
  "expo-image-manipulator": "latest"
}
```

Install with: `npm install`

## Usage Examples

### Uploading a Vehicle Photo

```typescript
import { uploadVehiclePhoto } from '../services/storage-service';

// After creating vehicle in database
const vehicleId = 'uuid-from-database';
const imageUri = 'file:///path/to/image.jpg'; // From ImagePicker

try {
  const publicUrl = await uploadVehiclePhoto(vehicleId, imageUri);
  // Update vehicle record with publicUrl
  await updateVehicle(vehicleId, { profile_image: publicUrl });
} catch (error) {
  console.error('Upload failed:', error);
  // Show error to user
}
```

### Uploading a Maintenance Receipt

```typescript
import { uploadMaintenanceReceipt } from '../services/storage-service';

// After creating maintenance record in database
const recordId = 'uuid-from-database';
const imageUri = 'file:///path/to/receipt.jpg'; // From ImagePicker

try {
  const signedUrl = await uploadMaintenanceReceipt(recordId, imageUri);
  // Update maintenance record with signedUrl
  await updateMaintenanceRecord(recordId, { 
    attachment_urls: [signedUrl] 
  });
} catch (error) {
  console.error('Upload failed:', error);
  // Show error to user
}
```

### Deleting a Photo

```typescript
import { deleteImage, VEHICLE_PHOTOS_BUCKET } from '../services/storage-service';

// When deleting a vehicle or updating its photo
const photoUrl = 'https://supabase.co/storage/v1/object/public/vehicle-photos/vehicle-id_timestamp.jpg';

await deleteImage(VEHICLE_PHOTOS_BUCKET, photoUrl);
```

## Integration with Database Services

### Recommended Flow

1. **Create Record in Database**
   ```typescript
   const vehicle = await createVehicle({ make, model, year });
   const vehicleId = vehicle.vehicle_id;
   ```

2. **Upload Photo with Real ID**
   ```typescript
   if (photoUri) {
     const photoUrl = await uploadVehiclePhoto(vehicleId, photoUri);
     await updateVehicle(vehicleId, { profile_image: photoUrl });
   }
   ```

3. **Display Photo**
   ```typescript
   <Image source={{ uri: vehicle.profile_image }} />
   ```

### Current MVP Implementation

The current implementation collects photo URIs in the UI forms. When integrating with a real database service:

1. Create the vehicle/maintenance record first
2. Get the real ID from the database
3. Upload the photo using the real ID
4. Update the database record with the photo URL

This ensures RLS policies can properly validate ownership.

## Security Considerations

1. **RLS Policies**: All storage operations are protected by Row Level Security policies
2. **Ownership Validation**: Users can only upload to their own vehicles/records
3. **File Size Limits**: 5MB maximum to prevent abuse
4. **File Type Validation**: Only JPEG and PNG images allowed
5. **Private Receipts**: Maintenance receipts use signed URLs for private access

## Error Handling

The service includes comprehensive error handling:

- File validation errors (size, type)
- Upload failures
- Permission issues
- Network errors
- Missing files

All errors are logged and thrown with user-friendly messages.

## Testing

To test the photo upload functionality:

1. **Vehicle Photos**:
   - Open AddVehicleModal
   - Tap "Add Photo"
   - Choose camera or gallery
   - Select/take a photo
   - Verify preview shows
   - Save vehicle

2. **Maintenance Receipts**:
   - Open Maintenance screen
   - Tap "+" button
   - Fill in service details
   - Tap "Add Receipt Photo"
   - Choose camera or gallery
   - Select/take a photo
   - Verify preview shows
   - Save service record

3. **Photo Viewing**:
   - View maintenance records
   - Tap photo thumbnail
   - Verify full-size view opens
   - Tap to close

## Performance Optimization

- Images are compressed before upload (typically under 500KB)
- Lazy loading for photo lists
- Thumbnails for list views
- Caching enabled for network images

## Future Enhancements

Potential improvements for future iterations:

1. **Multiple Photos**: Support multiple photos per vehicle/record
2. **Photo Editing**: Crop, rotate, filters before upload
3. **Progress Tracking**: Upload progress bar
4. **Retry Logic**: Automatic retry for failed uploads
5. **Offline Support**: Queue uploads when offline
6. **Image Optimization**: Different sizes for thumbnails vs full view
7. **Delete Cascade**: Automatically delete photos when deleting vehicles/records

## Troubleshooting

### Upload Fails with RLS Error

**Problem**: Upload fails with "new row violates row-level security policy"

**Solution**: Ensure the vehicle/maintenance record exists in the database before uploading. The filename must contain a valid ID that matches a record owned by the current user.

### Private Images Not Loading

**Problem**: Maintenance receipt images don't load

**Solution**: Ensure you're using signed URLs (not public URLs) for the private "maintenance-receipts" bucket. Signed URLs expire after 1 year by default.

### Images Too Large

**Problem**: Upload takes too long or fails

**Solution**: The service automatically compresses images. If still too large, check that the original image is under 5MB. Consider reducing MAX_IMAGE_WIDTH or IMAGE_QUALITY constants.

## Dependencies

- `expo-image-picker`: Camera and gallery access
- `expo-image-manipulator`: Image compression and resizing
- `expo-file-system`: File reading and validation
- `@supabase/supabase-js`: Storage API access

## License

Part of the Gear AI CoPilot project.
