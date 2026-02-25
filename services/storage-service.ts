/**
 * Gear AI CoPilot - Storage Service
 * 
 * Handles image uploads to Supabase Storage for vehicle photos and maintenance receipts
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';

// Constants
const MAX_IMAGE_WIDTH = 1920;
const IMAGE_QUALITY = 0.85;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Storage bucket names
export const VEHICLE_PHOTOS_BUCKET = 'vehicle-photos';
export const MAINTENANCE_RECEIPTS_BUCKET = 'maintenance-receipts';

/**
 * Validate image file size and type
 * @param imageUri - Local URI of the image
 * @returns True if valid, throws error otherwise
 */
async function validateImage(imageUri: string): Promise<boolean> {
  // Check file exists and get info
  const fileInfo = await FileSystem.getInfoAsync(imageUri);
  
  if (!fileInfo.exists) {
    throw new Error('Image file does not exist');
  }
  
  // Check file size
  if (fileInfo.size && fileInfo.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Image file too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`);
  }
  
  // Check file extension (basic validation)
  const extension = imageUri.split('.').pop()?.toLowerCase();
  if (!extension || !['jpg', 'jpeg', 'png'].includes(extension)) {
    throw new Error('Invalid file type. Only JPEG and PNG images are supported');
  }
  
  return true;
}

/**
 * Compress and resize image to optimize for upload
 * @param imageUri - Local URI of the image
 * @returns URI of the compressed image
 */
async function compressImage(imageUri: string): Promise<string> {
  try {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: MAX_IMAGE_WIDTH,
          },
        },
      ],
      {
        compress: IMAGE_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    return manipulatedImage.uri;
  } catch (error) {
    console.error('[Storage Service] Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
}

/**
 * Upload vehicle photo to Supabase Storage
 * @param vehicleId - ID of the vehicle
 * @param imageUri - Local URI of the image to upload
 * @returns Public URL of the uploaded image
 */
export async function uploadVehiclePhoto(
  vehicleId: string,
  imageUri: string
): Promise<string> {
  try {
    // Validate image
    await validateImage(imageUri);
    
    // Compress image
    const compressedUri = await compressImage(imageUri);
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${vehicleId}_${timestamp}.jpg`;
    
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert base64 to blob
    const blob = base64ToBlob(base64, 'image/jpeg');
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(VEHICLE_PHOTOS_BUCKET)
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });
    
    if (error) {
      console.error('[Storage Service] Upload error:', error);
      throw new Error(`Failed to upload vehicle photo: ${error.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(VEHICLE_PHOTOS_BUCKET)
      .getPublicUrl(filename);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('[Storage Service] Error uploading vehicle photo:', error);
    throw error;
  }
}

/**
 * Upload maintenance receipt photo to Supabase Storage
 * @param recordId - ID of the maintenance record
 * @param imageUri - Local URI of the image to upload
 * @returns Private URL (signed URL) of the uploaded image
 */
export async function uploadMaintenanceReceipt(
  recordId: string,
  imageUri: string
): Promise<string> {
  try {
    // Validate image
    await validateImage(imageUri);
    
    // Compress image
    const compressedUri = await compressImage(imageUri);
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${recordId}_${timestamp}.jpg`;
    
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert base64 to blob
    const blob = base64ToBlob(base64, 'image/jpeg');
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(MAINTENANCE_RECEIPTS_BUCKET)
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });
    
    if (error) {
      console.error('[Storage Service] Upload error:', error);
      throw new Error(`Failed to upload receipt photo: ${error.message}`);
    }
    
    // Get signed URL for private bucket (expires in 1 year)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(MAINTENANCE_RECEIPTS_BUCKET)
      .createSignedUrl(filename, 31536000); // 1 year in seconds
    
    if (urlError || !urlData) {
      console.error('[Storage Service] Error getting signed URL:', urlError);
      throw new Error('Failed to get receipt photo URL');
    }
    
    return urlData.signedUrl;
  } catch (error) {
    console.error('[Storage Service] Error uploading receipt photo:', error);
    throw error;
  }
}

/**
 * Delete image from storage bucket
 * @param bucketName - Name of the storage bucket
 * @param filePath - Path to the file in the bucket (can be full URL or just filename)
 */
export async function deleteImage(
  bucketName: string,
  filePath: string
): Promise<void> {
  try {
    // Extract filename from URL if needed
    let filename = filePath;
    if (filePath.includes('/')) {
      const parts = filePath.split('/');
      filename = parts[parts.length - 1];
    }
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filename]);
    
    if (error) {
      console.error('[Storage Service] Delete error:', error);
      // Don't throw error for delete operations - log and continue
      console.warn(`Failed to delete image ${filename} from ${bucketName}: ${error.message}`);
    }
  } catch (error) {
    console.error('[Storage Service] Error deleting image:', error);
    // Don't throw - delete errors should not break the flow
  }
}

/**
 * Get public URL for an image
 * @param bucketName - Name of the storage bucket
 * @param filePath - Path to the file in the bucket
 * @returns Public URL of the image
 */
export async function getImageUrl(
  bucketName: string,
  filePath: string
): Promise<string> {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Helper function to convert base64 to Blob
 * @param base64 - Base64 encoded string
 * @param contentType - MIME type of the content
 * @returns Blob object
 */
function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: contentType });
}
