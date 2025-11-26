import { isSeller } from './auth';
import { createProduct } from './productService';
import { submitSellerApplication, getUserSellerApplications } from './userService';
import { approveSellerApplication, rejectSellerApplication } from './adminService';
// Workflow service to handle the complete user journey
// 1. User registers as buyer (handled in auth.ts)
// 2. User applies for seller account
export const applyForSellerAccount = async (applicationData) => {
    try {
        return await submitSellerApplication(applicationData);
    }
    catch (error) {
        console.error('Error applying for seller account:', error);
        throw error;
    }
};
// 3. Admin approves seller application
export const approveSeller = async (applicationId, adminNotes) => {
    try {
        await approveSellerApplication(applicationId, adminNotes);
    }
    catch (error) {
        console.error('Error approving seller:', error);
        throw error;
    }
};
// 4. Admin rejects seller application
export const rejectSeller = async (applicationId, rejectionReason, adminNotes) => {
    try {
        await rejectSellerApplication(applicationId, rejectionReason, adminNotes);
    }
    catch (error) {
        console.error('Error rejecting seller:', error);
        throw error;
    }
};
// 5. Approved seller uploads product
export const sellerUploadProduct = async (productData, sellerId) => {
    try {
        // Check if user is an approved seller
        const isUserSeller = await isSeller(sellerId);
        if (!isUserSeller) {
            throw new Error('Only approved sellers can upload products');
        }
        // Add seller information to product data
        const productWithSeller = Object.assign(Object.assign({}, productData), { sellerId: sellerId, sellerName: productData.sellerName || 'Unknown Seller', status: 'active' });
        return await createProduct(productWithSeller);
    }
    catch (error) {
        console.error('Error uploading product:', error);
        throw error;
    }
};
// 6. User adds product to cart
export const addToCartWorkflow = async (userId, product, quantity = 1) => {
    // This is handled in cartService.ts
    // Just ensuring the workflow is documented
    console.log('Add to cart workflow', { userId, product, quantity });
};
// 7. User creates reel
export const createReelWorkflow = async (reelData) => {
    // This is handled in reelsService.ts
    // Just ensuring the workflow is documented
    console.log('Create reel workflow', reelData);
};
// 8. User creates story
export const createStoryWorkflow = async (storyData) => {
    // This is handled in storiesService.ts
    // Just ensuring the workflow is documented
    console.log('Create story workflow', storyData);
};
// Get user's application status
export const getUserApplicationStatus = async (userId) => {
    try {
        const applications = await getUserSellerApplications(userId);
        return applications;
    }
    catch (error) {
        console.error('Error getting user application status:', error);
        return [];
    }
};
