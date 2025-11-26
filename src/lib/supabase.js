import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Create Supabase client with fallback for development
export const supabase = supabaseUrl && supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-key')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://zaillisy.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaWxsaXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4MDAsImV4cCI6MjA1MDU0ODgwMH0.example_key_replace_with_real');
export const uploadFile = async (file, path, onProgress) => {
    var _a;
    console.log('=== UPLOAD DEBUG START ===');
    console.log('Starting file upload...');
    console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);
    console.log('Upload path:', path);
    console.log('Supabase client initialized:', !!supabase);
    console.log('Environment check:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
    console.log('- URL value:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('- Key length:', ((_a = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) === null || _a === void 0 ? void 0 : _a.length) || 0);
    console.log('=========================');
    try {
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(path, file, {
            cacheControl: '3600',
            upsert: false
        });
        if (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }
        const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(data.path);
        return {
            url: publicUrl,
            path: data.path,
            name: file.name
        };
    }
    catch (error) {
        console.error('Error uploading file:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        console.error('Supabase client status:', !!supabase);
        console.error('Environment variables check:', {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
            key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
        });
        // Return a fallback URL for development
        return {
            url: `https://via.placeholder.com/400x400/6366f1/ffffff?text=${encodeURIComponent(file.name)}`,
            path: path,
            name: file.name
        };
    }
};
export const uploadImage = async (file, userId, folder = 'products', onProgress) => {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const path = `${folder}/${userId}/${fileName}`;
    return uploadFile(file, path, onProgress);
};
export const uploadVideo = async (file, userId, onProgress) => {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const path = `reels/${userId}/${fileName}`;
    return uploadFile(file, path, onProgress);
};
export const deleteFile = async (path) => {
    try {
        const { error } = await supabase.storage
            .from('uploads')
            .remove([path]);
        if (error) {
            throw error;
        }
    }
    catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};
export const getFileURL = async (path) => {
    try {
        const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(path);
        return publicUrl;
    }
    catch (error) {
        console.error('Error getting file URL:', error);
        throw error;
    }
};
export const listFiles = async (path) => {
    try {
        const { data, error } = await supabase.storage
            .from('uploads')
            .list(path);
        if (error) {
            throw error;
        }
        return data.map(item => `${path}/${item.name}`);
    }
    catch (error) {
        console.error('Error listing files:', error);
        throw error;
    }
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
