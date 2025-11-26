// ✅ AWS DYNAMODB - Firestore completely removed
// Stories service .ts - DISABLED (stories feature removed)

export const getStories = async () => {
  console.warn('⚠️ Stories feature removed');
  return [];
}

export const createStory = async (storyData: any) => {
  console.warn('⚠️ Stories feature removed');
  return null;
}

export const deleteStory = async (storyId: string) => {
  console.warn('⚠️ Stories feature removed');
}

export const getUserStories = async (userId: string) => {
  console.warn('⚠️ Stories feature removed');
  return [];
}
