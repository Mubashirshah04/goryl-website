// ✅ AWS DYNAMODB - Firestore completely removed
// KYC Service - AWS stubs

export const submitKYC = async (userId: string, kycData: any) => {
  console.warn('⚠️ submitKYC: AWS implementation pending');
  return `kyc_${Date.now()}`;
}

export const getKYCStatus = async (userId: string) => {
  console.warn('⚠️ getKYCStatus: AWS implementation pending');
  return { status: 'pending', verified: false };
}

export const verifyKYC = async (kycId: string, verified: boolean) => {
  console.warn('⚠️ verifyKYC: AWS implementation pending');
}

export const updateKYC = async (kycId: string, updates: any) => {
  console.warn('⚠️ updateKYC: AWS implementation pending');
}

export const getAllKYCSubmissions = async () => {
  console.warn('⚠️ getAllKYCSubmissions: AWS implementation pending');
  return [];
}

// Backwards-compatible named exports used in UI
// Backwards-compatible named exports used in UI
// UI previously called these with (data, userId?, email?) — keep compatibility
export const createArtisanKYC = async (data: any, userId?: string, email?: string) => {
  const uid = userId || data?.userId || 'unknown'
  const payload = { ...data, userId: uid, userEmail: email || data?.userEmail }
  return await submitKYC(String(uid), payload)
}

export const createBusinessKYC = async (data: any, userId?: string, email?: string) => {
  const uid = userId || data?.userId || 'unknown'
  const payload = { ...data, userId: uid, userEmail: email || data?.userEmail }
  return await submitKYC(String(uid), payload)
}

export const validateCNIC = (cnic: string) => {
  const cleaned = String(cnic || '').replace(/[^0-9]/g, '');
  return cleaned.length === 13;
}
