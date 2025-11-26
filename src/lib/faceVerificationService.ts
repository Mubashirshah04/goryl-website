/**
 * Strict Face Verification Service
 * Compares CNIC photo with selfie to prevent fraud
 */

// Dynamic import for face-api to prevent SSR issues
let faceapi: any = null;

export interface FaceVerificationResult {
  success: boolean;
  similarityScore: number; // 0-100
  matchThreshold: number; // 80 = strict
  facesDetected: {
    cnic: number;
    selfie: number;
  };
  errors: string[];
  warnings: string[];
  isLivenessDetected?: boolean; // Detect if photo vs live
}

let modelsLoaded = false;
// Use CDN for models - @vladmandic/face-api provides models via CDN
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

// Lazy load face-api only on client side to prevent SSR issues
async function getFaceAPI() {
  if (typeof window === 'undefined') {
    throw new Error('Face API can only be used on the client side');
  }
  
  if (!faceapi) {
    faceapi = await import('@vladmandic/face-api');
  }
  
  return faceapi;
}

/**
 * Load face-api models (only once)
 * DISABLED - Face recognition removed
 */
export async function loadFaceModels(): Promise<void> {
  console.log('⚠️ Face verification disabled');
  modelsLoaded = true;
  return;
}

/**
 * Detect faces in an image
 */
async function detectFaces(image: HTMLImageElement | HTMLCanvasElement): Promise<any[]> {
  if (typeof window === 'undefined') {
    throw new Error('Face detection can only be used on the client side');
  }
  
  const api = await getFaceAPI();
  const detection = await api
    .detectAllFaces(image, new api.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();
  
  return detection;
}

export type LivenessStep = 'center' | 'left' | 'right' | 'up' | 'blink';

export interface LivenessDetectionResult {
  step: LivenessStep;
  completed: boolean;
  faceDetected: boolean;
  faceDirection: 'center' | 'left' | 'right' | 'up' | 'down' | 'unknown';
  eyesOpen: boolean;
  blinkDetected: boolean;
  confidence: number;
  instructions: string;
}

/**
 * Real-time face detection from video stream
 * Returns face detection status
 */
export async function detectFaceInVideo(video: HTMLVideoElement): Promise<{
  faceDetected: boolean;
  faceCount: number;
  isFacingForward: boolean;
  confidence: number;
}> {
  if (typeof window === 'undefined') {
    return {
      faceDetected: false,
      faceCount: 0,
      isFacingForward: false,
      confidence: 0
    };
  }
  
  if (!modelsLoaded) {
    await loadFaceModels();
  }

  try {
    const api = await getFaceAPI();
    const detections = await api
      .detectAllFaces(video, new api.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    
    if (detections.length === 0) {
      return {
        faceDetected: false,
        faceCount: 0,
        isFacingForward: false,
        confidence: 0
      };
    }

    // Check if face is facing forward (looks at camera)
    const firstFace = detections[0];
    const landmarks = firstFace.landmarks;
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    // Calculate eye positions
    const leftEyeCenter = {
      x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
      y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length
    };
    const rightEyeCenter = {
      x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
      y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length
    };

    // Calculate face width
    const faceBox = firstFace.detection.box;
    const faceWidth = faceBox.width;
    const eyeDistance = Math.abs(rightEyeCenter.x - leftEyeCenter.x);

    // Face is facing forward if eye distance is reasonable (not too small = not too angled)
    const eyeToFaceRatio = eyeDistance / faceWidth;
    const isFacingForward = eyeToFaceRatio >= 0.3 && eyeToFaceRatio <= 0.5; // Normal range
    
    // Face size check (should be large enough in frame)
    const faceArea = faceBox.width * faceBox.height;
    const frameArea = video.videoWidth * video.videoHeight;
    const faceRatio = faceArea / frameArea;
    const isFaceSizeGood = faceRatio >= 0.05; // At least 5% of frame

    const confidence = firstFace.detection.score;

    return {
      faceDetected: detections.length > 0 && isFaceSizeGood,
      faceCount: detections.length,
      isFacingForward: isFacingForward && isFaceSizeGood,
      confidence: confidence
    };
  } catch (error) {
    console.error('Face detection error:', error);
    return {
      faceDetected: false,
      faceCount: 0,
      isFacingForward: false,
      confidence: 0
    };
  }
}

/**
 * Advanced Liveness Detection - EasyPaisa/Binance Style
 * Detects face direction and eye blinks for anti-spoofing
 */
export async function detectLivenessStep(
  video: HTMLVideoElement,
  currentStep: LivenessStep
): Promise<LivenessDetectionResult> {
  if (typeof window === 'undefined') {
    return {
      step: currentStep,
      completed: false,
      faceDetected: false,
      faceDirection: 'unknown',
      eyesOpen: false,
      blinkDetected: false,
      confidence: 0,
      instructions: 'Face detection is only available on the client side.'
    };
  }
  
  if (!modelsLoaded) {
    await loadFaceModels();
  }

  try {
    const api = await getFaceAPI();
    const detections = await api
      .detectAllFaces(video, new api.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    if (detections.length === 0) {
      return {
        step: currentStep,
        completed: false,
        faceDetected: false,
        faceDirection: 'unknown',
        eyesOpen: false,
        blinkDetected: false,
        confidence: 0,
        instructions: 'Face not detected. Please position your face in the center.'
      };
    }

    const face = detections[0];
    const landmarks = face.landmarks;
    const expressions = face.expressions;

    // Get facial landmarks
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const nose = landmarks.getNoseTip();
    
    // Calculate eye positions
    const leftEyeCenter = {
      x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
      y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length
    };
    const rightEyeCenter = {
      x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
      y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length
    };
    
    const noseTip = {
      x: nose[0].x,
      y: nose[0].y
    };

    // Calculate face center
    const faceCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const frameCenterX = video.videoWidth / 2;

    // Detect face direction based on eye position relative to frame center
    let faceDirection: 'center' | 'left' | 'right' | 'up' | 'down' | 'unknown' = 'unknown';
    
    const eyeOffsetX = faceCenterX - frameCenterX;
    const eyeOffsetPercent = (eyeOffsetX / frameCenterX) * 100;

    // Eye blink detection - check if eyes are closed
    const leftEyeHeight = Math.max(...leftEye.map(p => p.y)) - Math.min(...leftEye.map(p => p.y));
    const rightEyeHeight = Math.max(...rightEye.map(p => p.y)) - Math.min(...rightEye.map(p => p.y));
    const avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2;
    const eyeAspectRatio = avgEyeHeight / Math.abs(rightEyeCenter.x - leftEyeCenter.x);
    
    // Eyes are closed if aspect ratio is very small
    const eyesOpen = eyeAspectRatio > 0.15; // Threshold for open eyes
    const blinkDetected = !eyesOpen && eyeAspectRatio < 0.10;

    // Detect face direction
    if (Math.abs(eyeOffsetPercent) < 15) {
      faceDirection = 'center';
    } else if (eyeOffsetPercent < -15) {
      faceDirection = 'left'; // Face turned left (right eye closer to center)
    } else if (eyeOffsetPercent > 15) {
      faceDirection = 'right'; // Face turned right (left eye closer to center)
    }

    // Detect up/down movement based on nose position relative to eyes
    const eyeLevelY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
    const noseOffsetY = noseTip.y - eyeLevelY;
    const normalNoseOffset = 15; // Normal offset when facing forward
    
    if (noseOffsetY < normalNoseOffset - 10) {
      faceDirection = 'up'; // Looking up
    } else if (noseOffsetY > normalNoseOffset + 10) {
      faceDirection = 'down';
    }

    // Check if current step is completed
    let completed = false;
    let instructions = '';

    switch (currentStep) {
      case 'center':
        completed = faceDirection === 'center' && eyesOpen;
        instructions = completed 
          ? '✅ Face centered. Hold position...'
          : 'Look directly at the camera. Hold your CNIC next to your face.';
        break;
      
      case 'left':
        completed = faceDirection === 'left' && Math.abs(eyeOffsetPercent) > 20;
        instructions = completed
          ? '✅ Left side detected. Hold...'
          : 'Turn your face to the LEFT while holding CNIC.';
        break;
      
      case 'right':
        completed = faceDirection === 'right' && Math.abs(eyeOffsetPercent) > 20;
        instructions = completed
          ? '✅ Right side detected. Hold...'
          : 'Turn your face to the RIGHT while holding CNIC.';
        break;
      
      case 'up':
        completed = faceDirection === 'up' && noseOffsetY < normalNoseOffset - 8;
        instructions = completed
          ? '✅ Upward movement detected. Hold...'
          : 'Look UPWARD while holding CNIC.';
        break;
      
      case 'blink':
        completed = blinkDetected;
        instructions = completed
          ? '✅ Blink detected!'
          : 'Close and OPEN your EYES (blink).';
        break;
    }

    return {
      step: currentStep,
      completed,
      faceDetected: true,
      faceDirection,
      eyesOpen,
      blinkDetected,
      confidence: face.detection.score,
      instructions
    };
  } catch (error) {
    console.error('Liveness detection error:', error);
    return {
      step: currentStep,
      completed: false,
      faceDetected: false,
      faceDirection: 'unknown',
      eyesOpen: false,
      blinkDetected: false,
      confidence: 0,
      instructions: 'Detection error. Please try again.'
    };
  }
}

/**
 * Calculate face similarity between two face descriptors
 * Returns similarity score 0-1 (1 = identical)
 */
function calculateFaceSimilarity(
  descriptor1: Float32Array,
  descriptor2: Float32Array
): number {
  if (descriptor1.length !== descriptor2.length) {
    return 0;
  }
  
  // Cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < descriptor1.length; i++) {
    dotProduct += descriptor1[i] * descriptor2[i];
    norm1 += descriptor1[i] * descriptor1[i];
    norm2 += descriptor2[i] * descriptor2[i];
  }
  
  const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  // Convert to 0-100 scale
  return Math.max(0, Math.min(100, (similarity + 1) * 50));
}

/**
 * Load image from file
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Check if image shows signs of being printed/photographed (anti-spoofing)
 * Basic liveness detection - checks image quality, lighting, angles
 */
async function detectLiveness(
  image: HTMLImageElement,
  faceDetection: any
): Promise<boolean> {
  // Basic checks for live photo vs printed image
  
  // 1. Check face size relative to image (too small might be printed)
  const faceBox = faceDetection.detection.box;
  const faceArea = faceBox.width * faceBox.height;
  const imageArea = image.width * image.height;
  const faceRatio = faceArea / imageArea;
  
  // Face should be at least 5% of image (for selfies)
  if (faceRatio < 0.05) {
    return false; // Likely printed/photographed
  }
  
  // 2. Check face angle (extreme angles suggest printed photo)
  const landmarks = faceDetection.landmarks;
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  
  // Calculate eye distance
  const eyeDistance = Math.sqrt(
    Math.pow(rightEye[0].x - leftEye[0].x, 2) +
    Math.pow(rightEye[0].y - leftEye[0].y, 2)
  );
  
  // Check if face is too rotated (more than 30 degrees is suspicious)
  const faceWidth = faceBox.width;
  const eyeToWidthRatio = eyeDistance / faceWidth;
  
  // Normal face should have eye distance ~40% of face width
  // Too small ratio = face rotated too much (printed photo on angle)
  if (eyeToWidthRatio < 0.3) {
    return false;
  }
  
  // 3. Check image sharpness (printed photos often have artifacts)
  // This is a simplified check - real implementation would use more advanced techniques
  
  return true; // Passes basic liveness checks
}

/**
 * Strict Face Verification
 * Compares CNIC photo with selfie to ensure they match
 * DISABLED - Face verification removed
 */
export async function verifyFaceMatch(
  cnicFrontFile: File,
  selfieFile: File,
  strictThreshold: number = 80 // 80% similarity required
): Promise<FaceVerificationResult> {
  console.log('⚠️ Face verification disabled - returning success');
  
  // Return success without actual verification
  const result: FaceVerificationResult = {
    success: true,
    similarityScore: 100,
    matchThreshold: strictThreshold,
    facesDetected: {
      cnic: 1,
      selfie: 1
    },
    errors: [],
    warnings: ['Face verification is currently disabled'],
    isLivenessDetected: true
  };

  return result;
}

/**
 * Validate selfie requirements before verification
 */
export function validateSelfieForVerification(file: File): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // File type check
  if (!file.type.startsWith('image/')) {
    errors.push('Selfie must be an image file');
    return { isValid: false, errors, warnings };
  }

  // File size check (too large might be edited)
  if (file.size > 10 * 1024 * 1024) {
    errors.push('Selfie file size too large (max 10MB)');
  }

  // Check filename for screenshots
  const fileName = file.name.toLowerCase();
  if (fileName.includes('screenshot') || fileName.includes('screen')) {
    errors.push('Screenshot detected. Please take a live photo with your camera.');
  }

  // Check if modified date is suspicious (same as today might be recent photo = good)
  const fileDate = new Date(file.lastModified);
  const daysSinceModified = (Date.now() - fileDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceModified > 30) {
    warnings.push('Photo appears to be older than 30 days. Please take a fresh photo.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

