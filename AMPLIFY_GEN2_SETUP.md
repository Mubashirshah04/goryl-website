# Amplify Gen 2 Setup - Complete Guide

## ✅ What's Been Done

1. **Amplify Gen 2 Initialized**
   - `amplify.ts` - Main backend definition
   - `auth/resource.ts` - Authentication setup
   - `data/resource.ts` - Database schema (DynamoDB)
   - `storage/resource.ts` - File storage setup
   - `amplify.json` - Project configuration
   - `.amplifyrc` - Amplify CLI configuration

2. **Dependencies Installed**
   - `@aws-amplify/backend`
   - `@aws-amplify/data-schema`
   - `aws-cdk` and `aws-cdk-lib`
   - `constructs`

3. **NPM Scripts Added**
   - `npm run amplify:sandbox` - Local development
   - `npm run amplify:deploy` - Deploy to AWS
   - `npm run amplify:pull` - Pull latest from AWS

## 🚀 Next Steps

### Step 1: Configure AWS Credentials
```bash
amplify configure
```
- Select region: `ap-south-1`
- Use existing AWS account
- Create new IAM user (if needed)

### Step 2: Test Locally (Sandbox)
```bash
npm run amplify:sandbox
```
This starts a local backend for development.

### Step 3: Deploy to AWS
```bash
npm run amplify:deploy
```

### Step 4: Connect to GitHub (for CI/CD)
1. Go to AWS Amplify Console
2. Create new app → Connect GitHub
3. Select repository: `goryl-website`
4. Select branch: `main`
5. Amplify will auto-deploy on push

## 📋 Features Configured

### Authentication
- ✅ Email login/signup
- ✅ Multi-factor authentication (optional)
- ✅ Account recovery
- ✅ User attributes: email, phone, name, picture

### Database (DynamoDB)
- ✅ Users table
- ✅ Products table
- ✅ Orders table
- ✅ Reviews table
- ✅ Authorization rules (owner, authenticated, public)

### Storage (S3)
- ✅ Public files
- ✅ Protected files (per user)
- ✅ Private files (per user)

## 🔧 Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_AWS_REGION=ap-south-1
NEXT_PUBLIC_AMPLIFY_APP_ID=d310am9mixqzg3
```

## 📚 Useful Commands

```bash
# Local development
npm run amplify:sandbox

# Deploy backend
npm run amplify:deploy

# Pull latest backend
npm run amplify:pull

# View backend status
amplify status

# View logs
amplify logs

# Delete backend
amplify delete
```

## ✨ Benefits of Gen 2

- ✅ **Faster** - CDK-based, better performance
- ✅ **Simpler** - TypeScript-first configuration
- ✅ **Better DX** - Sandbox for local development
- ✅ **Modern** - Latest AWS best practices
- ✅ **Scalable** - Built for production

## 🎯 Current Status

- ✅ Gen 2 setup complete
- ✅ Backend resources defined
- ✅ Ready for deployment
- ⏳ Waiting for AWS credentials configuration

**Next:** Run `amplify configure` to set up AWS credentials!
