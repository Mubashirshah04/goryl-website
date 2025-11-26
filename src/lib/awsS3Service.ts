/**
 * AWS S3 Service for Storage
 * 
 * Pure AWS S3 - replaces Firebase Storage completely
 * Fast, cost-effective, perfect for e-commerce
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// AWS Configuration
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
// Default to goryl-storage bucket (user's AWS bucket name)
const S3_BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'goryl-storage';
const CDN_URL = process.env.NEXT_PUBLIC_S3_CDN_URL || `https://${S3_BUCKET_NAME}.s3.${REGION}.amazonaws.com`;

// Get AWS Credentials (works on both client and server)
const getAWSCredentials = () => {
  // Debug: Log available env vars (only in dev) - More detailed logging
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const allEnvKeys = Object.keys(process.env);
    const awsKeys = allEnvKeys.filter(k => k.includes('AWS'));
    const hasAccessKey = !!(process.env.AWS_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID);
    const hasSecretKey = !!(process.env.AWS_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY);
    
    console.log('🔍 AWS Credentials Check:', {
      hasAccessKey,
      hasSecretKey,
      accessKeyPrefix: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID?.substring(0, 8) || 'not found',
      secretKeyLength: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY?.length || 0,
      totalAWSEnvVars: awsKeys.length,
      awsEnvVarKeys: awsKeys.filter(k => !k.includes('SECRET')) // Don't log secret keys
    });
  }

  // Try to get credentials - prefer server-side vars, fallback to public vars
  const accessKeyId = (process.env.AWS_ACCESS_KEY_ID 
    || process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID 
    || '').trim();
  const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY 
    || process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY 
    || '').trim();

  // Check if credentials are missing or are placeholder values
  const placeholderPatterns = [
    'your_aws_access_key_id',
    'your_aws_secret_access_key',
    'AKIAXXXXXXXXXXXXXXXX',
    'your_secret_access_key_here',
    'XXXXXXXXXXXXX'
  ];

  const isPlaceholder = (value: string) => {
    return placeholderPatterns.some(pattern => 
      value.toLowerCase().includes(pattern.toLowerCase())
    );
  };

  // Don't check length too strictly - some valid keys might be shorter/longer
  if (!accessKeyId || !secretAccessKey || isPlaceholder(accessKeyId) || isPlaceholder(secretAccessKey)) {
    console.warn('⚠️ AWS Credentials missing or invalid. Please add valid AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to .env.local');
    console.warn('💡 Note: After adding credentials, restart the dev server and rebuild: npm run build && npm run dev');
    return undefined;
  }

  // Basic validation: Access Key ID should be at least 16 characters (most AWS keys are 20)
  // Note: We don't check for 'AKIA' prefix as temporary credentials (ASIA) and other formats are valid
  if (accessKeyId.length < 16) {
    console.warn('⚠️ AWS Access Key ID seems too short. Most AWS access keys are 20 characters.');
    console.warn('   Got:', accessKeyId.substring(0, 8) + '... (length: ' + accessKeyId.length + ')');
    // Don't block - let AWS SDK validate
  }

  // Basic validation: Secret Access Key should not be too short
  if (secretAccessKey.length < 20) {
    console.warn('⚠️ AWS Secret Access Key seems too short. Should be at least 40 characters.');
    // Don't block - let AWS SDK validate
  }

  return {
    accessKeyId,
    secretAccessKey,
  };
};

// Get S3 Client (lazy initialization)
const getS3Client = () => {
  const credentials = getAWSCredentials();
  
  // Throw error if no credentials instead of creating client without them
  if (!credentials || !credentials.accessKeyId || !credentials.secretAccessKey) {
    const errorMessage = 'AWS Credentials are missing or invalid. Please add valid NEXT_PUBLIC_AWS_ACCESS_KEY_ID and NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY to your .env.local file.\n\n' +
      'Format:\n' +
      'NEXT_PUBLIC_AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX\n' +
      'NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=your_secret_access_key_here\n\n' +
      'See AWS_CREDENTIALS_SETUP.md for details.';
    throw new Error(errorMessage);
  }
  
  // Double-check credentials are not empty before creating client
  if (credentials.accessKeyId.trim() === '' || credentials.secretAccessKey.trim() === '') {
    throw new Error('AWS Credentials cannot be empty strings. Please set valid credentials in .env.local');
  }
  
  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });
};

export interface UploadResult {
  url: string;
  path: string;
  name: string;
}

/**
 * Upload file to S3
 */
export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    console.log('🚀 Uploading to AWS S3:', path);
    console.log('📦 Using S3 Bucket:', S3_BUCKET_NAME);
    console.log('🌍 AWS Region:', REGION);
    
    // Get S3 client with credentials (will throw if credentials missing)
    const s3Client = getS3Client();
    
    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    
    // Convert ArrayBuffer to Buffer (works in both browser and Node.js)
    let buffer: Buffer | Uint8Array;
    if (typeof Buffer !== 'undefined') {
      // Node.js environment
      buffer = Buffer.from(arrayBuffer);
    } else {
      // Browser environment - use Uint8Array directly
      buffer = new Uint8Array(arrayBuffer);
    }

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: path,
      Body: buffer,
      ContentType: file.type,
      CacheControl: 'max-age=31536000', // 1 year cache
      ACL: 'public-read', // Public read access
    });

    // Upload with progress tracking
    if (onProgress) {
      // Simulate progress for S3 (actual progress tracking requires different approach)
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress < 90) {
          onProgress(progress);
        }
      }, 100);
      
      await s3Client.send(command);
      clearInterval(interval);
      onProgress(100);
    } else {
      await s3Client.send(command);
    }

    // Get public URL
    const url = `${CDN_URL}/${path}`;

    console.log('✅ Upload complete:', url);

    return {
      url,
      path,
      name: file.name,
    };
  } catch (error) {
    console.error('❌ Error uploading to S3:', error);
    throw error;
  }
};

/**
 * Upload image to S3
 */
export const uploadImage = async (
  file: File,
  userId: string,
  folder: 'profile' | 'products' | 'reels' | 'stories' = 'products',
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const path = `${folder}/${userId}/${fileName}`;

  return uploadFile(file, path, onProgress);
};

/**
 * Upload video to S3
 */
export const uploadVideo = async (
  file: File,
  userId: string,
  folder: 'products' | 'reels' | 'stories' = 'products',
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const path = `${folder}/${userId}/${fileName}`;

  return uploadFile(file, path, onProgress);
};

/**
 * Delete file from S3
 */
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const s3Client = getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: path,
    });

    await s3Client.send(command);
    console.log('✅ File deleted from S3:', path);
  } catch (error) {
    console.error('❌ Error deleting from S3:', error);
    throw error;
  }
};

/**
 * Get signed URL for private file access
 */
export const getSignedFileUrl = async (
  path: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> => {
  try {
    const s3Client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: path,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('❌ Error getting signed URL:', error);
    throw error;
  }
};

/**
 * Check if file exists
 */
export const fileExists = async (path: string): Promise<boolean> => {
  try {
    const s3Client = getS3Client();
    const command = new HeadObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: path,
    });

    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
};

/**
 * Get optimized image URL (with CloudFront CDN if configured)
 */
export const getOptimizedImageUrl = (
  imageUrl: string,
  width?: number,
  height?: number,
  quality: number = 80
): string => {
  if (!imageUrl || imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  // If using CloudFront CDN, add resize parameters
  if (imageUrl.includes('cloudfront.net')) {
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('q', quality.toString());
    params.append('f', 'webp');

    return `${imageUrl}?${params.toString()}`;
  }

  // Direct S3 URL
  return imageUrl;
};

export default {
  uploadFile,
  uploadImage,
  uploadVideo,
  deleteFile,
  getSignedFileUrl,
  fileExists,
  getOptimizedImageUrl,
};


