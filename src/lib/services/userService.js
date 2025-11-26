// ✅ AWS DYNAMODB - Firestore completely removed
// User service - using awsUserService

export const getUserProfile = async (userId) => {
    try {
        const { getUserProfile: getAWSProfile } = await import('../awsUserService');
        return await getAWSProfile(userId);
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

export const getUserByUsername = async (username) => {
    try {
        const { getUserByUsername: getAWSUser } = await import('../awsUserService');
        return await getAWSUser(username);
    } catch (error) {
        console.error('Error getting user by username:', error);
        return null;
    }
}

export const updateUserProfile = async (userId, updates) => {
    try {
        const { updateUserProfile: updateAWSProfile } = await import('../awsUserService');
        return await updateAWSProfile(userId, updates);
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

export const createUserProfile = async (userId, profileData) => {
    try {
        const { createUserProfile: createAWSProfile } = await import('../awsUserService');
        return await createAWSProfile(userId, profileData);
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
}

export const followUser = async (userId, targetUserId) => {
    try {
        const { followUser: followAWSUser } = await import('../awsUserService');
        return await followAWSUser(userId, targetUserId);
    } catch (error) {
        console.error('Error following user:', error);
        throw error;
    }
}

export const unfollowUser = async (userId, targetUserId) => {
    try {
        const { unfollowUser: unfollowAWSUser } = await import('../awsUserService');
        return await unfollowAWSUser(userId, targetUserId);
    } catch (error) {
        console.error('Error unfollowing user:', error);
        throw error;
    }
}
