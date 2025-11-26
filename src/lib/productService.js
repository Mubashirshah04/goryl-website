// AWS DynamoDB Product Service with Caching and Batch Operations
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchGetCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.NEXT_PUBLIC_AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true }
});

// In-memory cache with 5-minute TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 25; // DynamoDB batch size limit

// Cache helpers
const getCached = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.data;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Efficient batch get products
const batchGetProducts = async (ids) => {
  const uniqueIds = [...new Set(ids)];
  const batches = [];

  // Split into batches of BATCH_SIZE
  for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + BATCH_SIZE);
    batches.push(batch);
  }

  // Process all batches in parallel
  const results = await Promise.all(
    batches.map(async (batchIds) => {
      const params = {
        RequestItems: {
          [process.env.NEXT_PUBLIC_AWS_PRODUCTS_TABLE]: {
            Keys: batchIds.map(id => ({ id }))
          }
        }
      };

      const { Responses } = await docClient.send(new BatchGetCommand(params));
      return Responses?.[process.env.NEXT_PUBLIC_AWS_PRODUCTS_TABLE] || [];
    })
  );

  // Flatten results and cache them
  const products = results.flat();
  products.forEach(product => {
    setCache(`product:${product.id}`, product);
  });

  return products;
};

// Get products with caching and efficient querying
export const getProducts = async (filters = {}, orderByField = 'createdAt', orderDirection = 'desc', limit = 50) => {
  try {
    const cacheKey = `products:${JSON.stringify({ filters, orderByField, orderDirection, limit })}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const params = {
      TableName: process.env.NEXT_PUBLIC_AWS_PRODUCTS_TABLE,
      IndexName: `${orderByField}Index`,
      Limit: limit,
      ScanIndexForward: orderDirection === 'asc'
    };

    // Add filters if present
    if (Object.keys(filters).length > 0) {
      const conditions = [];
      const attributes = {};
      const values = {};

      Object.entries(filters).forEach(([key, value], index) => {
        conditions.push(`#${key} = :${key}`);
        attributes[`#${key}`] = key;
        values[`:${key}`] = value;
      });

      params.KeyConditionExpression = conditions.join(' AND ');
      params.ExpressionAttributeNames = attributes;
      params.ExpressionAttributeValues = values;
    }

    const { Items = [] } = await docClient.send(new QueryCommand(params));
    setCache(cacheKey, Items);
    return Items;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

// Get single product by ID with caching
export const getProductById = async (productId) => {
  try {
    const cacheKey = `product:${productId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const params = {
      TableName: process.env.NEXT_PUBLIC_AWS_PRODUCTS_TABLE,
      Key: { id: productId }
    };

    const { Item } = await docClient.send(new GetCommand(params));
    if (Item) setCache(cacheKey, Item);
    return Item || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

// Create new product
export const createProduct = async (productData) => {
  try {
    const params = {
      TableName: process.env.NEXT_PUBLIC_AWS_PRODUCTS_TABLE,
      Item: {
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    await docClient.send(new PutCommand(params));
    setCache(`product:${params.Item.id}`, params.Item);
    return params.Item;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async (productId, updates) => {
  try {
    const updateDate = new Date().toISOString();
    const params = {
      TableName: process.env.NEXT_PUBLIC_AWS_PRODUCTS_TABLE,
      Key: { id: productId },
      UpdateExpression: 'set updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':updatedAt': updateDate
      },
      ReturnValues: 'ALL_NEW'
    };

    // Add update fields
    Object.entries(updates).forEach(([key, value], index) => {
      params.UpdateExpression += `, #field${index} = :value${index}`;
      params.ExpressionAttributeNames = {
        ...params.ExpressionAttributeNames,
        [`#field${index}`]: key
      };
      params.ExpressionAttributeValues[`:value${index}`] = value;
    });

    const { Attributes } = await docClient.send(new UpdateCommand(params));
    if (Attributes) {
      setCache(`product:${productId}`, Attributes);
    }
    return Attributes;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async (productId) => {
  try {
    const params = {
      TableName: process.env.NEXT_PUBLIC_AWS_PRODUCTS_TABLE,
      Key: { id: productId }
    };

    await docClient.send(new DeleteCommand(params));
    cache.delete(`product:${productId}`);
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Toggle product like with optimistic updates
export const toggleProductLike = async (productId, userId) => {
  try {
    // Get current product state
    const product = await getProductById(productId);
    if (!product) throw new Error('Product not found');

    // Optimistically update cache
    const likes = product.likes || [];
    const likeIndex = likes.indexOf(userId);
    const newLikes = [...likes];
    
    if (likeIndex === -1) {
      newLikes.push(userId);
    } else {
      newLikes.splice(likeIndex, 1);
    }

    // Update cache immediately
    const optimisticProduct = {
      ...product,
      likes: newLikes,
      likeCount: newLikes.length
    };
    setCache(`product:${productId}`, optimisticProduct);

    // Update database
    await updateProduct(productId, {
      likes: newLikes,
      likeCount: newLikes.length
    });

    return true;
  } catch (error) {
    // Revert cache on error
    cache.delete(`product:${productId}`);
    console.error('Error toggling product like:', error);
    throw error;
  }
};
