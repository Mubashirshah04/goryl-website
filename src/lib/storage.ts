// AWS S3 Storage - Pure AWS (replaces Firebase Storage)
import { uploadFile as s3UploadFile, uploadImage as s3UploadImage, uploadVideo as s3UploadVideo, deleteFile as s3DeleteFile, getSignedFileUrl, fileExists } from './awsS3Service'

export interface UploadResult {
  url: string
  path: string
  name: string
}

export const uploadFile = async (
  file: File, 
  path: string, 
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    // Use AWS S3 for upload
    return await s3UploadFile(file, path, onProgress)
  } catch (error) {
    console.error('Error uploading file to S3:', error)
    throw error
  }
}

export const uploadImage = async (
  file: File, 
  userId: string, 
  folder: 'profile' | 'products' | 'reels' = 'products',
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  // Use AWS S3 for image upload
  return await s3UploadImage(file, userId, folder, onProgress)
}

export const uploadVideo = async (
  file: File, 
  userId: string, 
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  // Use AWS S3 for video upload
  return await s3UploadVideo(file, userId, 'reels', onProgress)
}

export const deleteFile = async (path: string): Promise<void> => {
  try {
    // Use AWS S3 for file deletion
    await s3DeleteFile(path)
  } catch (error) {
    console.error('Error deleting file from S3:', error)
    throw error
  }
}

export const getFileURL = async (path: string): Promise<string> => {
  try {
    // Check if file exists, then return public URL or signed URL
    const exists = await fileExists(path)
    if (exists) {
      // For public files, construct public URL
      const CDN_URL = process.env.NEXT_PUBLIC_S3_CDN_URL || ''
      return `${CDN_URL}/${path}`
    }
    // For private files, get signed URL
    return await getSignedFileUrl(path, 3600)
  } catch (error) {
    console.error('Error getting file URL from S3:', error)
    throw error
  }
}

export const listFiles = async (path: string): Promise<string[]> => {
  try {
    // Note: S3 list operations require ListObjectsV2 API
    // For now, return empty array (implement if needed)
    console.warn('listFiles not implemented for S3 yet')
    return []
  } catch (error) {
    console.error('Error listing files from S3:', error)
    throw error
  }
}

export const compressImage = async (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      const newWidth = img.width * ratio
      const newHeight = img.height * ratio
      
      // Set canvas dimensions
      canvas.width = newWidth
      canvas.height = newHeight
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, newWidth, newHeight)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        file.type,
        quality
      )
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export const validateFile = (
  file: File, 
  maxSize: number = 10 * 1024 * 1024, // 10MB
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/mov']
): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB` 
    }
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
    }
  }
  
  return { valid: true }
}
