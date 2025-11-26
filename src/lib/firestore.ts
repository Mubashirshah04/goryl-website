// Lightweight Firestore shim to keep imports compiling while runtime is AWS
// Exports common Firestore function names as no-ops or simple adapters.

export type DocumentData = any;
export type QueryDocumentSnapshot<T = any> = any;
export type Query<T = any> = any;

export const collection = (..._args: any[]): any => {
  throw new Error('Firestore has been removed. Use AWS-backed services instead.');
};

export const doc = (..._args: any[]): any => {
  throw new Error('Firestore has been removed. Use AWS-backed services instead.');
};

export const getDoc = async (_ref: any): Promise<any> => {
  return null;
};

export const setDoc = async (_ref: any, _data: any): Promise<void> => {
  return;
};

export const updateDoc = async (_ref: any, _data: any): Promise<void> => {
  return;
};

export const addDoc = async (_ref: any, _data: any): Promise<any> => {
  return null;
};

export const deleteDoc = async (_ref: any): Promise<void> => {
  return;
};

export const query = (..._args: any[]): any => {
  return {} as any;
};

export const where = (..._args: any[]): any => {
  return {} as any;
};

export const orderBy = (..._args: any[]): any => {
  return {} as any;
};

export const startAfter = (..._args: any[]): any => {
  return {} as any;
};

export const limit = (..._args: any[]): any => {
  return {} as any;
};

export const getDocs = async (_q: any): Promise<any> => {
  return { docs: [] } as any;
};

// Lightweight db placeholder for files that call `collection(db, path)`
export const db: any = {};

// Subscribe helpers used in UI (no-op / adapter to AWS runtime)
export const subscribeToCollection = (..._args: any[]) => {
  console.warn('subscribeToCollection: Firestore removed; subscription is a no-op.');
  return () => {};
}

export const onSnapshot = (_ref: any, cb: (snapshot: any) => void, err?: (e: any) => void) => {
  console.warn('onSnapshot: Firestore removed; onSnapshot is a no-op.');
  try {
    cb({ docs: [] });
  } catch (e) {
    if (err) err(e);
  }
  return () => {};
}

export const subscribeToDocument = (..._args: any[]) => {
  console.warn('subscribeToDocument: Firestore removed; subscription is a no-op.');
  return () => {};
}

// getDocument(collectionName, id) compatibility helper used across UI
export const getDocument = async (collectionNameOrRef: any, id?: string): Promise<any | null> => {
  console.warn('getDocument: Firestore removed; returning null placeholder.');
  return null;
}

export const getCountFromServer = async (_q: any): Promise<any> => {
  return { data: () => ({ count: 0 }) } as any;
};

export const serverTimestamp = (): any => {
  return new Date();
};

export const arrayUnion = (..._args: any[]) => [] as any;
export const arrayRemove = (..._args: any[]) => [] as any;

export const firestoreLimit = limit; // some files reference firestoreLimit

export default {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  getDocs,
  getCountFromServer,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
};
