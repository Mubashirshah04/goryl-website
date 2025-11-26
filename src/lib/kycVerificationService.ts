// ✅ AWS DYNAMODB - Firestore completely removed
// KYC Verification Service - AWS stubs

export const verifyIdentity = async (userId: string, identityData: any) => {
  console.warn('⚠️ verifyIdentity: AWS implementation pending');
  return { verified: false, confidence: 0 };
}

export const verifyDocument = async (documentUrl: string, documentType: string) => {
  console.warn('⚠️ verifyDocument: AWS implementation pending');
  return { verified: false, valid: false };
}

export const performFaceMatch = async (selfieUrl: string, idPhotoUrl: string) => {
  console.warn('⚠️ performFaceMatch: AWS implementation pending');
  return { match: false, confidence: 0 };
}

export const getVerificationStatus = async (userId: string) => {
  console.warn('⚠️ getVerificationStatus: AWS implementation pending');
  return { status: 'pending', verified: false };
}

// Backwards-compatible helpers expected by UI
export const strictValidateCNIC = async (cnic: string) => {
  const cleaned = String(cnic || '').replace(/[^0-9]/g, '');
  const isValid = cleaned.length === 13;
  const errors: string[] = [];
  if (!isValid) errors.push('CNIC must be 13 digits');
  return { isValid, errors, formatted: cleaned };
}

export const validateDocumentImage = async (file: File | string) => {
  // Very basic placeholder validation with consistent shape expected by UI
  return {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
    // Quality score in percentage (0-100)
    qualityScore: 100
  };
}

export const strictCheckCNICDuplication = async (cnic: string) => {
  // Placeholder: no duplication check available
  return { isDuplicate: false, riskScore: 0 };
}

export const validateSelfieRequirements = async (file: File | string) => {
  return { meetsRequirements: true };
}

export const generateDeviceFingerprint = () => {
  return `fp_${Date.now()}`;
}

export const getClientIP = async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch (e) {
    return '0.0.0.0';
  }
}
