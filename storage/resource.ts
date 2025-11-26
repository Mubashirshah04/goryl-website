import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'gorylStorage',
  access: (allow) => ({
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'protected/{entity_id}/*': [
      allow.entity('identityId').to(['read', 'write', 'delete']),
      allow.authenticated.to(['read']),
    ],
    'private/{entity_id}/*': [
      allow.entity('identityId').to(['read', 'write', 'delete']),
    ],
  }),
});
