/**
 * AWS Cognito Configuration
 * 
 * This file provides a reliable way to access AWS Cognito environment variables.
 * It handles multiple loading scenarios and provides fallbacks.
 */

// Helper function to safely get environment variables
function getEnvVariable(key: string): string {
  // Try all possible sources
  const sources = [
    // 1. Direct process.env (works in all environments)
    () => process.env[key],
    // 2. Try without NEXT_PUBLIC_ prefix (server-side)
    () => process.env[key.replace('NEXT_PUBLIC_', '')],
    // 3. Try window globals (client-side, after build)
    () => typeof window !== 'undefined' && (window as any).__ENV__?.[key],
    // 4. Try next.js build-time injection
    () => typeof window !== 'undefined' && (window as any).__NEXT_DATA__?.env?.[key],
  ];

  for (const source of sources) {
    try {
      const value = source();
      if (value && typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    } catch (e) {
      // Silently continue to next source
    }
  }

  return '';
}

// Validate that all required variables are set
function validateConfig(): { isValid: boolean; missing: string[] } {
  const required = [
    'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
    'NEXT_PUBLIC_COGNITO_CLIENT_ID',
    'NEXT_PUBLIC_COGNITO_DOMAIN',
    'NEXT_PUBLIC_AWS_REGION',
  ];

  const missing: string[] = [];

  for (const key of required) {
    const value = getEnvVariable(key);
    if (!value) {
      missing.push(key);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}

// Export configuration object
export const cognitoConfig = {
  // Get individual variables
  get userPoolId(): string {
    return getEnvVariable('NEXT_PUBLIC_COGNITO_USER_POOL_ID');
  },
  get clientId(): string {
    return getEnvVariable('NEXT_PUBLIC_COGNITO_CLIENT_ID');
  },
  get domain(): string {
    return getEnvVariable('NEXT_PUBLIC_COGNITO_DOMAIN');
  },
  get region(): string {
    return getEnvVariable('NEXT_PUBLIC_AWS_REGION') || 'ap-south-1';
  },
  get accessKeyId(): string {
    return getEnvVariable('NEXT_PUBLIC_AWS_ACCESS_KEY_ID');
  },
  get secretAccessKey(): string {
    return getEnvVariable('NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY');
  },

  // Validate configuration
  validate(): { isValid: boolean; missing: string[] } {
    return validateConfig();
  },

  // Get all as object
  getAll() {
    return {
      userPoolId: this.userPoolId,
      clientId: this.clientId,
      domain: this.domain,
      region: this.region,
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
    };
  },
};

// Debug logging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Only log once per page load
  const logKey = '__cognito_config_logged__';
  if (!(window as any)[logKey]) {
    (window as any)[logKey] = true;
    
    const config = cognitoConfig.getAll();
    const validation = cognitoConfig.validate();
    
    console.log('🔐 Cognito Configuration:', {
      userPoolId: config.userPoolId ? '✅ Set' : '❌ Missing',
      clientId: config.clientId ? '✅ Set' : '❌ Missing',
      domain: config.domain ? '✅ Set' : '❌ Missing',
      region: config.region ? '✅ Set' : '❌ Missing',
      isValid: validation.isValid,
      missing: validation.missing,
    });

    if (!validation.isValid) {
      console.warn('⚠️ Missing Cognito configuration:', validation.missing);
      console.log('Run: npm run verify:cognito');
    }
  }
}

