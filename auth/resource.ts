import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
    },
  },
  multifactorAuthentication: {
    mode: 'OPTIONAL',
    totp: true,
  },
  accountRecovery: 'EMAIL_ONLY',
  userAttributes: {
    email: {
      mutable: true,
      required: true,
    },
    phone_number: {
      mutable: true,
    },
    name: {
      mutable: true,
    },
    picture: {
      mutable: true,
    },
  },
});
