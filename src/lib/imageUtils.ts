/**
 * Local SVG placeholder image utilities
 * Replaces external via.placeholder.com calls with local SVG data URIs
 */

/**
 * Generate a local SVG placeholder image as data URI
 */
function getPlaceholderImage(
  width: number,
  height: number,
  text: string = 'No Image',
  bgColor: string = '#f3f4f6',
  textColor: string = '#9ca3af'
): string {
  // Escape text for XML
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${bgColor}"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${escapedText}</text></svg>`;

  // Use encodeURIComponent for better compatibility than base64
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Avatar placeholder (24x24)
 */
export const AVATAR_PLACEHOLDER = getPlaceholderImage(24, 24, 'U', '#1f2937', '#9ca3af');

/**
 * Product placeholders - theme aware
 */
export const PRODUCT_PLACEHOLDER_LIGHT = getPlaceholderImage(400, 400, 'No Image', '#f3f4f6', '#9ca3af');
export const PRODUCT_PLACEHOLDER_DARK = getPlaceholderImage(400, 400, 'No Image', '#1f2937', '#6b7280');

/**
 * Get product placeholder based on theme
 */
export function getProductPlaceholder(isDark?: boolean): string {
  if (isDark === undefined && typeof window !== 'undefined') {
    isDark = document.documentElement.classList.contains('dark');
  }
  return isDark ? PRODUCT_PLACEHOLDER_DARK : PRODUCT_PLACEHOLDER_LIGHT;
}

/**
 * Get product placeholder for specific size
 */
export function getProductPlaceholderBySize(
  width: number,
  height: number,
  isDark?: boolean
): string {
  const bgColor = isDark === undefined 
    ? (typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#1f2937' : '#f3f4f6')
    : (isDark ? '#1f2937' : '#f3f4f6');
  const textColor = bgColor === '#1f2937' ? '#6b7280' : '#9ca3af';
  return getPlaceholderImage(width, height, 'No Image', bgColor, textColor);
}

