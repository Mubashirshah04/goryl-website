import { optimizeAndUploadImage, generateImageSizes } from './imageOptimizationService';
import { uploadOptimizedVideo } from './videoOptimizationService';
import { performanceService } from './performanceService';

interface UploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  convertToWebP?: boolean;
  generateThumbnails?: boolean;
}

interface VideoUploadOptions {
  quality?: 'low' | 'medium' | 'high';
  generateThumbnail?: boolean;
}

export class UploadOptimizationService {
  private static instance: UploadOptimizationService;

  static getInstance(): UploadOptimizationService {
    if (!UploadOptimizationService.instance) {
      UploadOptimizationService.instance = new UploadOptimizationService();
    }
    return UploadOptimizationService.instance;
  }

  // Optimize and upload product images
  async uploadProductImages(
    files: File[],
    productId: string,
    options: UploadOptions = {}
  ): Promise<string[]> {
    const trace = performanceService.startTrace('upload_product_images');
    
    try {
      const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 85,
        convertToWebP = true,
        generateThumbnails = true
      } = options;

      const uploadPromises = files.map(async (file, index) => {
        const path = `products/${productId}/image_${index}`;
        
        // Upload main image
        const mainImageUrl = await optimizeAndUploadImage(file, path, {
          maxWidth,
          maxHeight,
          quality,
          convertToWebP
        });

        // Generate thumbnails if requested
        if (generateThumbnails) {
          const thumbnailSizes = [
            { width: 150, height: 150, suffix: 'thumb' },
            { width: 300, height: 300, suffix: 'medium' },
            { width: 600, height: 600, suffix: 'large' }
          ];

          const thumbnails = await generateImageSizes(file, thumbnailSizes);
          console.log('Generated thumbnails:', thumbnails);
        }

        return mainImageUrl;
      });

      const imageUrls = await Promise.all(uploadPromises);
      performanceService.stopTrace(trace);
      
      return imageUrls;
    } catch (error) {
      performanceService.stopTrace(trace);
      console.error('Error uploading product images:', error);
      throw error;
    }
  }

  // Optimize and upload profile images
  async uploadProfileImage(
    file: File,
    userId: string,
    options: UploadOptions = {}
  ): Promise<string> {
    const trace = performanceService.startTrace('upload_profile_image');
    
    try {
      const {
        maxWidth = 400,
        maxHeight = 400,
        quality = 90,
        convertToWebP = true
      } = options;

      const path = `profiles/${userId}/avatar`;
      const imageUrl = await optimizeAndUploadImage(file, path, {
        maxWidth,
        maxHeight,
        quality,
        convertToWebP
      });

      performanceService.stopTrace(trace);
      return imageUrl;
    } catch (error) {
      performanceService.stopTrace(trace);
      console.error('Error uploading profile image:', error);
      throw error;
    }
  }

  // Optimize and upload story images
  async uploadStoryImage(
    file: File,
    userId: string,
    storyId: string,
    options: UploadOptions = {}
  ): Promise<string> {
    const trace = performanceService.startTrace('upload_story_image');
    
    try {
      const {
        maxWidth = 1080,
        maxHeight = 1920,
        quality = 80,
        convertToWebP = true
      } = options;

      const path = `stories/${userId}/${storyId}`;
      const imageUrl = await optimizeAndUploadImage(file, path, {
        maxWidth,
        maxHeight,
        quality,
        convertToWebP
      });

      performanceService.stopTrace(trace);
      return imageUrl;
    } catch (error) {
      performanceService.stopTrace(trace);
      console.error('Error uploading story image:', error);
      throw error;
    }
  }

  // Optimize and upload video
  async uploadVideo(
    file: File,
    path: string,
    options: VideoUploadOptions = {}
  ): Promise<{ videoUrl: string; thumbnailUrl?: string }> {
    const trace = performanceService.startTrace('upload_video');
    
    try {
      const { quality = 'medium', generateThumbnail = true } = options;
      
      const result = await uploadOptimizedVideo(file, path, {
        quality,
        generateThumbnail
      });

      performanceService.stopTrace(trace);
      return result;
    } catch (error) {
      performanceService.stopTrace(trace);
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  // Batch upload with progress tracking
  async batchUpload(
    files: File[],
    uploadFn: (file: File, index: number) => Promise<string>,
    onProgress?: (progress: number) => void
  ): Promise<string[]> {
    const results: string[] = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await uploadFn(files[i], i);
        results.push(result);
        
        if (onProgress) {
          onProgress(((i + 1) / total) * 100);
        }
      } catch (error) {
        console.error(`Error uploading file ${i}:`, error);
        // Continue with other files
      }
    }

    return results;
  }

  // Validate file before upload
  validateFile(file: File, type: 'image' | 'video'): { valid: boolean; error?: string } {
    const maxSize = type === 'image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024; // 10MB for images, 100MB for videos
    const allowedTypes = type === 'image' 
      ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      : ['video/mp4', 'video/webm', 'video/quicktime'];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${maxSize / (1024 * 1024)}MB`
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type must be one of: ${allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  // Get file preview URL
  getFilePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  // Clean up preview URLs
  revokePreview(url: string): void {
    URL.revokeObjectURL(url);
  }
}

export const uploadOptimizationService = UploadOptimizationService.getInstance();
export default uploadOptimizationService;
