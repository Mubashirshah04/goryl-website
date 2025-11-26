// ✅ AWS DYNAMODB - Firestore completely removed
// Presence service .js - AWS stubs

export const updateUserPresence = async (userId, status) => {
    console.warn('⚠️ updateUserPresence: AWS implementation pending');
}

export const getUserPresence = async (userId) => {
    console.warn('⚠️ getUserPresence: AWS implementation pending');
    return { online: false, lastSeen: new Date() };
}

export const subscribeToPresence = (userId, callback) => {
    console.warn('⚠️ subscribeToPresence: AWS implementation pending');
    callback({ online: false, lastSeen: new Date() });
    return () => { };
}
