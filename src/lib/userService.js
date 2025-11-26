// ✅ AWS DYNAMODB - Firestore completely removed
// User service .js - using awsUserService

export const getUserProfile = async (userId) => {
    try {
        const { getUserProfile: getAWSProfile } = await import('./awsUserService');
        return await getAWSProfile(userId);
    } catch (error) {
        return null;
    }
}

export const getUserByUsername = async (username) => {
    try {
        const { getUserByUsername: getAWSUser } = await import('./awsUserService');
        return await getAWSUser(username);
    } catch (error) {
        return null;
    }
}

export const updateUserProfile = async (userId, updates) => {
    try {
        const { updateUserProfile: updateAWSProfile } = await import('./awsUserService');
        return await updateAWSProfile(userId, updates);
    } catch (error) {
        throw error;
    }
}

export const createUserProfile = async (userId, profileData) => {
    try {
        const { createUserProfile: createAWSProfile } = await import('./awsUserService');
        return await createAWSProfile(userId, profileData);
    } catch (error) {
        throw error;
    }
}
