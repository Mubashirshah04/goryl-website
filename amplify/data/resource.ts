import { defineData, type ClientSchema } from '@aws-amplify/backend';
import { auth } from '../auth/resource';

const schema = {
  models: {
    Product: {
      fields: {
        id: { isArray: false, type: 'ID', isRequired: true },
        name: { isArray: false, type: 'String', isRequired: true },
        description: { isArray: false, type: 'String' },
        price: { isArray: false, type: 'Float', isRequired: true },
        category: { isArray: false, type: 'String' },
        image: { isArray: false, type: 'String' },
        createdAt: { isArray: false, type: 'AWSDateTime' },
        updatedAt: { isArray: false, type: 'AWSDateTime' },
      },
      primaryKeyFields: ['id'],
    },
  },
  enums: {},
  nonModels: {},
};

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInMinutes: 30,
    },
    userPoolAuthorizationMode: {},
  },
});
