// ✅ AWS DYNAMODB - Firestore completely removed
// Stories service .js - DISABLED (stories feature removed)

export const getStories = async () => {
    console.warn('⚠️ Stories feature removed');
    return [];
}

export const createStory = async (storyData) => {
    console.warn('⚠️ Stories feature removed');
    return null;
}

export const deleteStory = async (storyId) => {
    console.warn('⚠️ Stories feature removed');
}

export const getUserStories = async (userId) => {
    console.warn('⚠️ Stories feature removed');
    return [];
}
