/**
 * Global Image URL Validator
 * Ensures only real S3/HTTP URLs are used - NO blob URLs, NO data URLs
 * Used across entire website for consistency
 */

/**
 * Validate and get image URL
 * Returns null if URL is invalid (blob, data, empty)
 * Only accepts HTTP/HTTPS URLs (real S3 URLs)
 */
export const getValidImageUrl = (imageUrl: string | undefined | null): string | null => {
  if (!imageUrl) return null;

  // Reject blob URLs (temporary browser URLs - NEVER valid)
  if (imageUrl.startsWith('blob:')) {
    console.warn('🚫 Blob URL rejected:', imageUrl.substring(0, 50));
    return null;
  }

  // Reject data URLs (base64 encoded - NEVER valid for production)
  if (imageUrl.startsWith('data:')) {
    console.warn('🚫 Data URL rejected');
    return null;
  }

  // Accept ONLY HTTP/HTTPS URLs (real S3 URLs from AWS)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Reject any other format
  console.warn('🚫 Invalid URL format:', imageUrl.substring(0, 50));
  return null;
};

/**
 * Get image URL with fallback placeholder
 * Returns valid URL or placeholder SVG
 */
export const getImageUrlWithFallback = (
  imageUrl: string | undefined | null,
  fallbackUrl: string = '/product-placeholder.svg'
): string => {
  const validUrl = getValidImageUrl(imageUrl);
  return validUrl || fallbackUrl;
};

/**
 * Filter array of image URLs - remove all blob/data URLs
 * Returns only valid S3 URLs
 */
export const filterValidImageUrls = (images: (string | undefined | null)[]): string[] => {
  return images
    .map(img => getValidImageUrl(img))
    .filter((img): img is string => img !== null);
};

/**
 * Check if image URL is valid (S3 URL)
 */
export const isValidImageUrl = (imageUrl: string | undefined | null): boolean => {
  return getValidImageUrl(imageUrl) !== null;
};

/**
 * Get first valid image from array
 * Returns first valid S3 URL or null
 */
export const getFirstValidImage = (images: (string | undefined | null)[]): string | null => {
  for (const img of images) {
    const valid = getValidImageUrl(img);
    if (valid) return valid;
  }
  return null;
};
