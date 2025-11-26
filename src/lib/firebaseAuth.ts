import hybridAuth from './hybridAuthService';

// Compatibility shim for Firebase Auth methods used in the UI.
// These functions delegate to the AWS Cognito based `hybridAuthService`.

export const auth = {} as any;

export const signInWithEmailAndPassword = async (_auth: any, email: string, password: string) => {
  // Ignore _auth parameter (Firebase compat) and use Cognito
  return hybridAuth.signIn(email, password);
};

export const signOut = async (_auth?: any) => {
  return hybridAuth.signOut();
};

export const signInWithPopup = async (_auth: any, _provider: any) => {
  // Map popup sign-in to Cognito Google sign-in flow
  return hybridAuth.signInWithGoogle();
};

export class GoogleAuthProvider {
  // Stubbed provider for compatibility with existing UI
  constructor() {}
}

export default {
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
};
