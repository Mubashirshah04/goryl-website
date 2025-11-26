import { defineData } from '@aws-amplify/backend';
import { a } from '@aws-amplify/data-schema';

const schema = a.schema({
  // Users
  User: a
    .model({
      id: a.id().required(),
      email: a.email().required(),
      name: a.string(),
      photo: a.url(),
      role: a.enum(['NORMAL_USER', 'SELLER', 'BRAND', 'ADMIN']),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Products
  Product: a
    .model({
      id: a.id().required(),
      title: a.string().required(),
      description: a.string(),
      price: a.float().required(),
      originalPrice: a.float(),
      category: a.string(),
      images: a.url().array(),
      sellerId: a.string().required(),
      viewCount: a.integer(),
      likeCount: a.integer(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.public().to(['read']),
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  // Orders
  Order: a
    .model({
      id: a.id().required(),
      userId: a.string().required(),
      items: a.json().required(),
      total: a.float().required(),
      status: a.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
      shippingAddress: a.json(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Reviews
  Review: a
    .model({
      id: a.id().required(),
      productId: a.string().required(),
      userId: a.string().required(),
      rating: a.integer().required(),
      title: a.string(),
      comment: a.string(),
      helpfulCount: a.integer(),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.public().to(['read']),
      allow.authenticated().to(['create', 'read']),
    ]),
});

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
