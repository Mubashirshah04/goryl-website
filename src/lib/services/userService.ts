// ✅ AWS DYNAMODB - Firestore completely removed
// User service .ts - using awsUserService

export const getUserProfile = async (userId: string) => {
  try {
    const { getUserProfile: getAWSProfile } = await import('../awsUserService');
    return await getAWSProfile(userId);
  } catch (error) {
    return null;
  }
}

export const getUserByUsername = async (username: string) => {
  try {
    const { getUserByUsername: getAWSUser } = await import('../awsUserService');
    return await getAWSUser(username);
  } catch (error) {
    return null;
  }
}

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { updateUserProfile: updateAWSProfile } = await import('../awsUserService');
    return await updateAWSProfile(userId, updates);
  } catch (error) {
    throw error;
  }
}

export const createUserProfile = async (userId: string, profileData: any) => {
  try {
    const { createUserProfile: createAWSProfile } = await import('../awsUserService');
    return await createAWSProfile(userId, profileData);
  } catch (error) {
    throw error;
  }
}
