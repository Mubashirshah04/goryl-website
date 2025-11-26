// AWS S3 backed storage wrapper — replaces Firebase Storage
import {
  uploadFile as s3UploadFile,
  uploadImage as s3UploadImage,
  uploadVideo as s3UploadVideo,
  deleteFile as s3DeleteFile,
  getSignedFileUrl as s3GetSignedFileUrl,
  fileExists as s3FileExists,
} from './awsS3Service';

export const uploadFile = async (file, path, onProgress) => {
    try {
        return await s3UploadFile(file, path, onProgress);
    }
    catch (error) {
        console.error('Error uploading file to S3:', error);
        throw error;
    }
};

export const uploadImage = async (file, userId, folder = 'products', onProgress) => {
    try {
        return await s3UploadImage(file, userId, folder, onProgress);
    } catch (error) {
        console.error('Error uploading image to S3:', error);
        throw error;
    }
};

export const uploadVideo = async (file, userId, folder = 'reels', onProgress) => {
    try {
        return await s3UploadVideo(file, userId, folder, onProgress);
    } catch (error) {
        console.error('Error uploading video to S3:', error);
        throw error;
    }
};

export const deleteFile = async (path) => {
    try {
        return await s3DeleteFile(path);
    }
    catch (error) {
        console.error('Error deleting file from S3:', error);
        throw error;
    }
};

export const getFileURL = async (path) => {
    try {
        // Use signed URL for access (works for private/public buckets)
        return await s3GetSignedFileUrl(path);
    }
    catch (error) {
        console.error('Error getting file URL from S3:', error);
        throw error;
    }
};

export const listFiles = async (path) => {
    console.warn('listFiles: not implemented for S3 wrapper, returning empty list for', path);
    return [];
};
export const compressImage = async (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            // Calculate new dimensions
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            const newWidth = img.width * ratio;
            const newHeight = img.height * ratio;
            // Set canvas dimensions
            canvas.width = newWidth;
            canvas.height = newHeight;
            // Draw and compress
            ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(img, 0, 0, newWidth, newHeight);
            canvas.toBlob((blob) => {
                if (blob) {
                    const compressedFile = new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                }
                else {
                    reject(new Error('Failed to compress image'));
                }
            }, file.type, quality);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
};
export const validateFile = (file, maxSize = 10 * 1024 * 1024, // 10MB
allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/mov']) => {
    // Check file size
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
        };
    }
    // Check file type
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        };
    }
    return { valid: true };
};
