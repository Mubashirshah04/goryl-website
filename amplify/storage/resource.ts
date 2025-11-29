import { defineStorage } from '@aws-amplify/backend';
import { auth } from '../auth/resource';

export const storage = defineStorage({
  name: 'gorylStorage',
  access: (allow) => ({
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'protected/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
    'private/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
  }),
});
