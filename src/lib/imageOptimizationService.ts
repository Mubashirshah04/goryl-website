import { uploadFile, uploadImage, getFileURL, compressImage } from '@/lib/firebaseStorage';

// WebP conversion utility
export const convertToWebP = (file: File, quality: number = 80): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert to WebP'));
            }
          },
          'image/webp',
          quality / 100
        );
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Image resizing utility
export const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality: number = 80): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          'image/webp',
          quality / 100
        );
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Optimize and upload image
export const optimizeAndUploadImage = async (
  file: File,
  path: string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    convertToWebP?: boolean;
  } = {}
): Promise<string> => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 80,
    convertToWebP = true
  } = options;
  
  try {
    let processedFile: Blob;
    
    // Resize image if needed
    if (maxWidth || maxHeight) {
      processedFile = await resizeImage(file, maxWidth, maxHeight, quality);
    } else if (convertToWebP) {
      processedFile = await convertToWebP(file, quality);
    } else {
      processedFile = file;
    }
    
    // Upload to AWS S3 via firebaseStorage wrapper
    const uploadBlob = processedFile instanceof Blob ? new File([processedFile], file.name, { type: file.type }) : file;
    const result = await uploadFile(uploadBlob, path);
    return result.url;
  } catch (error) {
    console.error('Error optimizing and uploading image:', error);
    throw error;
  }
};

// Generate multiple image sizes
export const generateImageSizes = async (
  file: File,
  basePath: string,
  sizes: { width: number; height: number; suffix: string }[]
): Promise<Record<string, string>> => {
  const results: Record<string, string> = {};
  
  for (const size of sizes) {
    try {
      const resizedImage = await resizeImage(file, size.width, size.height, 80);
      const path = `${basePath}_${size.suffix}`;
      const uploadBlob = resizedImage instanceof Blob ? new File([resizedImage], file.name, { type: file.type }) : file;
      const result = await uploadFile(uploadBlob, path);
      results[size.suffix] = result.url;
    } catch (error) {
      console.error(`Error generating ${size.suffix} size:`, error);
    }
  }
  
  return results;
};

// Preload images
export const preloadImages = (urls: string[]): Promise<void[]> => {
  return Promise.all(
    urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to preload ${url}`));
        img.src = url;
      });
    })
  );
};

// Get responsive image srcset
export const getResponsiveSrcSet = (baseUrl: string, sizes: number[]): string => {
  return sizes
    .map(size => `${baseUrl}?w=${size}&f=webp ${size}w`)
    .join(', ');
};

// Lazy load image component
export const createLazyImage = (src: string, alt: string, className?: string): HTMLImageElement => {
  const img = document.createElement('img');
  img.alt = alt;
  img.className = className || '';
  img.loading = 'lazy';
  img.src = src;
  
  // Add intersection observer for lazy loading
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLImageElement;
        target.src = target.dataset.src || src;
        observer.unobserve(target);
      }
    });
  });
  
  observer.observe(img);
  
  return img;
};

export default {
  convertToWebP,
  resizeImage,
  optimizeAndUploadImage,
  generateImageSizes,
  preloadImages,
  getResponsiveSrcSet,
  createLazyImage
};
