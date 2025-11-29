# 🚀 Amplify Gen 2 - Direct Deployment (No GitHub)

## ✅ Safe Deployment - Server-Side Rendering

Your Next.js website is **server-side rendered (SSR)** and ready to deploy to AWS Amplify Hosting Gen 2.

---

## 📋 Quick Deployment Steps

### Step 1: Build Your App
```bash
npm run build
```

### Step 2: Deploy to Amplify Hosting

**Option A: Using AWS Console (Easiest)**

1. Go to: https://console.aws.amazon.com/amplify
2. Click **"Create app"**
3. Select **"Deploy without Git"**
4. Choose **"Drag and drop"** or **"Manual deploy"**
5. Upload your `.next/standalone` folder
6. Click **"Deploy"**

**Option B: Using Amplify CLI**

```bash
npm install -g @aws-amplify/cli
amplify hosting add
amplify publish
```

---

## 🔧 What Gets Deployed

Your `.next/standalone` folder contains:
- ✅ Server-side rendered pages
- ✅ API routes
- ✅ Static assets
- ✅ Node.js server

---

## 📦 Environment Variables (AWS Only)

Before deploying, set these **AWS-only** variables in **Amplify Console**:

1. Go to your app in Amplify Console
2. Click **"Environment variables"**
3. Add these variables:

```
# AWS Region
NEXT_PUBLIC_AWS_REGION=ap-south-1

# Cognito Authentication
NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-south-1_UrgROe7bY
NEXT_PUBLIC_COGNITO_CLIENT_ID=1dnqju9c3c6fhtq937fl5gmh8e
NEXT_PUBLIC_COGNITO_DOMAIN=zaillisy-auth.auth.ap-south-1.amazoncognito.com

# DynamoDB Tables
NEXT_PUBLIC_DYNAMODB_USERS_TABLE=goryl-users
NEXT_PUBLIC_DYNAMODB_PRODUCTS_TABLE=goryl-products
NEXT_PUBLIC_DYNAMODB_REELS_TABLE=goryl-reels
NEXT_PUBLIC_DYNAMODB_CHATS_TABLE=goryl-chats
NEXT_PUBLIC_DYNAMODB_MESSAGES_TABLE=goryl-messages
NEXT_PUBLIC_DYNAMODB_LIKES_TABLE=goryl-likes
NEXT_PUBLIC_DYNAMODB_NOTIFICATIONS_TABLE=goryl-notifications
NEXT_PUBLIC_DYNAMODB_ORDERS_TABLE=goryl-orders
NEXT_PUBLIC_AWS_REVIEWS_TABLE=ProductReviews

# S3 Storage
NEXT_PUBLIC_S3_BUCKET_NAME=goryl-storage
NEXT_PUBLIC_S3_CDN_URL=https://goryl-storage.s3.ap-south-1.amazonaws.com

# NextAuth
NEXTAUTH_SECRET=np2t7fw7fVJyyHRHNlBDPYRc9XvGHbPf4LUEFmi8j8M=
NEXTAUTH_URL=https://your-app.amplifyapp.com

# Admin
ADMIN_EMAILS=mobiletesting736@gmail.com,zaillisycom@gmail.com
NEXT_PUBLIC_ADMIN_EMAILS=mobiletesting736@gmail.com,zaillisycom@gmail.com
NEXT_PUBLIC_SES_FROM_EMAIL=zaillisy@gmail.com
NEXT_PUBLIC_APP_URL=https://your-app.amplifyapp.com

# AWS Credentials
AWS_ACCESS_KEY_ID=AKIAYLA4NN7R5LEPDX4Z
AWS_SECRET_ACCESS_KEY=GXtonWAUh8DC+jGptaRVDGBe2OtJYQt0P1LI48+o
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=AKIAYLA4NN7R5LEPDX4Z
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=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
```

---

## ✅ Verification After Deploy

Test these features:
- [ ] Website loads at live URL
- [ ] Home page displays
- [ ] Products load
- [ ] Search works
- [ ] API routes respond
- [ ] Firebase integration works
- [ ] File uploads work
- [ ] Authentication works

---

## 🎯 Your Live URL

After deployment, you'll get:
```
https://your-app.amplifyapp.com
```

---

## 🛠️ Troubleshooting

### Build fails
```bash
npm run build
# Check for errors, fix them, then rebuild
```

### API routes return 404
- Ensure `output: "standalone"` in `next.config.js` ✅ (already set)
- Check API routes are in `/src/app/api/`

### Environment variables not working
- Add them in Amplify Console (not in code)
- Restart deployment after adding

### Slow loading
- First deployment takes 5-10 minutes
- Subsequent deployments are faster

---

## 📊 Architecture

```
Your Code
    ↓
npm run build
    ↓
.next/standalone folder
    ↓
Upload to Amplify Hosting
    ↓
Live URL: https://your-app.amplifyapp.com
```

---

## 🚀 Ready to Deploy?

1. Run: `npm run build`
2. Go to AWS Amplify Console
3. Click "Create app" → "Deploy without Git"
4. Upload `.next/standalone` folder
5. Add environment variables
6. Click "Deploy"

**That's it!** Your website will be live in minutes. 🎉

---

## 📞 Support

- AWS Amplify: https://docs.amplify.aws
- Next.js: https://nextjs.org/docs
- AWS Console: https://console.aws.amazon.com

---

**Status:** Ready for deployment! ✅
