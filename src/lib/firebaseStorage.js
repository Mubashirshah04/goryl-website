// Removed direct Firebase storage imports — using S3 wrapper below
// import { storage } from './firebase';
// import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import {
    uploadFile as s3UploadFile,
    uploadImage as s3UploadImage,
    uploadVideo as s3UploadVideo,
    deleteFile as s3DeleteFile,
    getSignedFileUrl as s3GetSignedFileUrl,
} from './awsS3Service';

export const uploadFile = async (file, path, onProgress) => {
    try {
        return await s3UploadFile(file, path, onProgress);
    } catch (error) {
        console.error('S3 upload error:', error);
        return {
            url: `https://via.placeholder.com/400x400/6366f1/ffffff?text=${encodeURIComponent(file.name)}`,
            path,
            name: file.name,
        };
    }
};
