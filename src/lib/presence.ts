// ✅ AWS DYNAMODB - Firestore completely removed
// Presence service .ts - AWS stubs

export const updateUserPresence = async (userId: string, status: string) => {
  console.warn('⚠️ updateUserPresence: AWS implementation pending');
}

export const getUserPresence = async (userId: string) => {
  console.warn('⚠️ getUserPresence: AWS implementation pending');
  return { online: false, lastSeen: new Date() };
}

export const subscribeToPresence = (userId: string, callback: (presence: any) => void) => {
  console.warn('⚠️ subscribeToPresence: AWS implementation pending');
  callback({ online: false, lastSeen: new Date() });
  return () => { };
}