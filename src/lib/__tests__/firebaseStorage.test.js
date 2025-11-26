import { uploadFile, uploadImage, uploadVideo, validateFile } from '../firebaseStorage';
describe('Firebase Storage Service', () => {
    // Mock file for testing
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const mockImage = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' });
    const mockVideo = new File(['test video content'], 'test.mp4', { type: 'video/mp4' });
    describe('uploadFile', () => {
        it('should upload a file and return upload result', async () => {
            const result = await uploadFile(mockFile, 'test/path/test.txt');
            expect(result).toHaveProperty('url');
            expect(result).toHaveProperty('path');
            expect(result).toHaveProperty('name');
            expect(result.path).toBe('test/path/test.txt');
            expect(result.name).toBe('test.txt');
        });
    });
    describe('uploadImage', () => {
        it('should upload an image with proper path structure', async () => {
            const userId = 'test-user-id';
            const result = await uploadImage(mockImage, userId, 'products');
            expect(result).toHaveProperty('url');
            expect(result).toHaveProperty('path');
            expect(result).toHaveProperty('name');
            expect(result.path).toContain('products');
            expect(result.path).toContain(userId);
        });
    });
    describe('uploadVideo', () => {
        it('should upload a video with proper path structure', async () => {
            const userId = 'test-user-id';
            const result = await uploadVideo(mockVideo, userId);
            expect(result).toHaveProperty('url');
            expect(result).toHaveProperty('path');
            expect(result).toHaveProperty('name');
            expect(result.path).toContain('reels');
            expect(result.path).toContain(userId);
        });
    });
    describe('validateFile', () => {
        it('should validate file size', () => {
            const smallFile = new File(['small'], 'small.txt', { type: 'text/plain' });
            const result = validateFile(smallFile, 10); // 10 bytes max
            expect(result.valid).toBe(true);
        });
        it('should reject files that are too large', () => {
            const largeFile = new File([new ArrayBuffer(100)], 'large.txt', { type: 'text/plain' });
            const result = validateFile(largeFile, 50); // 50 bytes max
            expect(result.valid).toBe(false);
            expect(result.error).toContain('File size must be less than');
        });
        it('should validate file type', () => {
            const imageFile = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
            const result = validateFile(imageFile, 1024, ['image/jpeg']);
            expect(result.valid).toBe(true);
        });
        it('should reject unsupported file types', () => {
            const textFile = new File(['text'], 'test.txt', { type: 'text/plain' });
            const result = validateFile(textFile, 1024, ['image/jpeg']);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('File type not allowed');
        });
    });
    // Note: These tests are basic and would need to be expanded with proper mocks
    // for Firebase Storage in a real testing environment
});
