# DynamoDB Tables Setup Guide

## Required Tables

### 1. **goryl-seller-applications**
```
Primary Key: id (String)
No GSI needed - uses Scan with FilterExpression
```

**Attributes:**
```
id (String) - Primary Key
userId (String) - User ID
applicationType (String) - 'personal' or 'brand'
status (String) - 'pending', 'approved', 'rejected'
submittedAt (String) - ISO timestamp
reviewedAt (String) - ISO timestamp (optional)
reviewedBy (String) - Admin ID (optional)
userName (String)
userEmail (String)
userPhone (String)
businessName (String)
businessType (String)
category (String)
description (String)
website (String)
location (String)
estimatedRevenue (Number)
documents (String) - JSON stringified array
notes (String) - JSON stringified array
rejectionReason (String) - optional
address (String)
taxId (String)
```

### 2. **goryl-users**
```
Primary Key: id (String)
```

**Attributes:**
```
id (String) - Primary Key (Cognito sub)
email (String)
name (String)
phone (String)
role (String) - 'user', 'seller', 'brand'
accountType (String) - 'personal', 'brand'
username (String)
storeName (String)
profileImage (String)
createdAt (String)
updatedAt (String)
```

### 3. **goryl-products**
```
Primary Key: id (String)
```

### 4. **goryl-orders**
```
Primary Key: id (String)
```

### 5. **goryl-likes**
```
Primary Key: userId (String)
Sort Key: itemId (String)
```

### 6. **goryl-saves**
```
Primary Key: userId (String)
Sort Key: itemId (String)
```

## Important Notes

✅ **NO GSI NEEDED** - All queries use Scan with FilterExpression
✅ **NO INDEXES NEEDED** - Permanent fix for index errors
✅ **SIMPLE STRUCTURE** - Only primary keys, no complex indexes

## How to Create Tables

### Using AWS CLI:

```bash
# Create goryl-seller-applications
aws dynamodb create-table \
  --table-name goryl-seller-applications \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1

# Create goryl-users
aws dynamodb create-table \
  --table-name goryl-users \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

### Using AWS Console:

1. Go to DynamoDB → Tables
2. Click "Create table"
3. Table name: `goryl-seller-applications`
4. Primary key: `id` (String)
5. Billing mode: **On-demand**
6. Create

Repeat for other tables.

## Code Implementation

All code is already updated to use:
- ✅ `ScanCommand` instead of `QueryCommand`
- ✅ `FilterExpression` instead of `KeyConditionExpression`
- ✅ No index references
- ✅ Simple primary key lookups

## Error Prevention

The application service now:
1. ✅ Uses Scan for filtering by userId (no index needed)
2. ✅ Uses correct key structure `{ id: userId }` for updates
3. ✅ No references to non-existent indexes
4. ✅ Handles missing tables gracefully

## Testing

After creating tables, test:
```
1. Personal account conversion
2. Brand account conversion
3. Application submission
4. Application tracking
```

All should work without errors! 🎉
