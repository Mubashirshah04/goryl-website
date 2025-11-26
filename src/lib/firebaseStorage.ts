import {
  uploadFile as s3UploadFile,
  uploadImage as s3UploadImage,
  uploadVideo as s3UploadVideo,
  deleteFile as s3DeleteFile,
  getSignedFileUrl,
  UploadResult as S3UploadResult
} from './awsS3Service';

// Re-export types
export type UploadResult = S3UploadResult;

/**
 * Upload file - Redirects to AWS S3
 */
export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  return s3UploadFile(file, path, onProgress);
}

/**
 * Upload image - Redirects to AWS S3
 */
export const uploadImage = async (
  file: File,
  userId: string,
  folder: 'profile' | 'products' | 'reels' | 'stories' = 'products',
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  return s3UploadImage(file, userId, folder, onProgress);
}

/**
 * Upload video - Redirects to AWS S3
 */
export const uploadVideo = async (
  file: File,
  userId: string,
  folder: 'products' | 'reels' | 'stories' = 'products',
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  return s3UploadVideo(file, userId, folder, onProgress);
}

/**
 * Delete file - Redirects to AWS S3
 */
export const deleteFile = async (path: string): Promise<void> => {
  return s3DeleteFile(path);
}

/**
 * Get File URL - Redirects to AWS S3 (signed URL)
 */
export const getFileURL = async (path: string): Promise<string> => {
  return getSignedFileUrl(path);
}

/**
 * Compress Image - Utility function (Local only, no cloud dependency)
 */
export const compressImage = async (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (!canvas) return resolve(file);
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      const newWidth = img.width * ratio;
      const newHeight = img.height * ratio;
      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx?.drawImage(img, 0, 0, newWidth, newHeight);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, { type: file.type, lastModified: Date.now() });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate File - Utility function (Local only)
 */
export const validateFile = (
  file: File,
  maxSize: number = 10 * 1024 * 1024, // 10MB
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/mov']
): { valid: boolean; error?: string } => {
  if (file.size > maxSize) return { valid: false, error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB` };
  if (!allowedTypes.includes(file.type)) return { valid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
  return { valid: true };
}

export default {
  uploadFile,
  uploadImage,
  uploadVideo,
  deleteFile,
  getFileURL,
  compressImage,
  validateFile,
};