# 🚀 Amplify Gen 2 Hosting Deployment Guide

## ✅ Safe Deployment - No Breaking Changes

Your website is ready to deploy to **AWS Amplify Hosting** with Gen 2. This guide ensures a safe, smooth deployment.

---

## 📋 Pre-Deployment Checklist

- ✅ Amplify Gen 2 backend initialized
- ✅ Next.js configured for standalone output
- ✅ AWS region bootstrapped (ap-south-1)
- ✅ All API routes preserved
- ✅ Firebase integration intact
- ✅ Environment variables ready

---

## 🔧 Step 1: Fix IAM Permissions (One-time setup)

Your AWS user needs SSM permissions. Go to **AWS IAM Console** and add this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:PutParameter",
        "ssm:DeleteParameter"
      ],
      "Resource": "arn:aws:ssm:ap-south-1:573437734883:parameter/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "amplify:*",
        "cloudformation:*",
        "iam:*",
        "s3:*"
      ],
      "Resource": "*"
    }
  ]
}
```

Or simply attach **AdministratorAccess** policy for development.

---

## 🌐 Step 2: Deploy to Amplify Hosting

### Option A: Using GitHub (Recommended - Auto-deploys on push)

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Setup Amplify Gen 2 hosting"
   git push origin main
   ```

2. **Connect to Amplify Console:**
   - Go to https://console.aws.amazon.com/amplify
   - Click "Create app"
   - Select "GitHub" as source
   - Authorize GitHub
   - Select your repository and branch
   - Click "Save and deploy"

3. **Amplify will automatically:**
   - Build your Next.js app
   - Deploy to Amplify Hosting
   - Provide you with a live URL

### Option B: Using Amplify CLI (Manual deployment)

1. **Install Amplify CLI:**
   ```bash
   npm install -g @aws-amplify/cli
   ```

2. **Deploy your app:**
   ```bash
   amplify hosting add
   # Select: Hosting with Amplify Console
   # Build and deploy: Yes
   ```

3. **Push to AWS:**
   ```bash
   amplify publish
   ```

---

## 📦 Step 3: Environment Variables

Create `.env.production` in your project root:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# AWS
NEXT_PUBLIC_AWS_REGION=ap-south-1
NEXT_PUBLIC_S3_BUCKET_NAME=goryl-storage

# Cognito (if using)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_pool_id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your_client_id
NEXT_PUBLIC_COGNITO_DOMAIN=your_domain
```

**In Amplify Console:**
1. Go to your app settings
2. Click "Environment variables"
3. Add all variables from `.env.production`

---

## ✅ Step 4: Verify Deployment

After deployment completes:

1. **Check the live URL** provided by Amplify
2. **Test key features:**
   - Home page loads
   - Products display
   - API routes work
   - Authentication works
   - File uploads work
   - Search functionality works

3. **Monitor logs:**
   ```bash
   amplify logs --follow
   ```

---

## 🔒 Security Best Practices

- ✅ Never commit `.env.local` to GitHub
- ✅ Use Amplify Console for production secrets
- ✅ Enable HTTPS (automatic with Amplify)
- ✅ Set up domain name (optional)
- ✅ Enable branch protection on GitHub

---

## 📊 Deployment Architecture

```
Your Code (GitHub)
        ↓
Amplify Console (Detects push)
        ↓
Build Next.js (standalone output)
        ↓
Deploy to Amplify Hosting
        ↓
Live URL: https://your-app.amplifyapp.com
```

---

## 🛠️ Troubleshooting

### Build fails with "Cannot find module"
- Run `npm install` locally first
- Commit `package-lock.json` to GitHub

### API routes return 404
- Ensure `output: "standalone"` in `next.config.js`
- Check that API routes are in `/src/app/api/`

### Environment variables not working
- Add them in Amplify Console (not in code)
- Restart deployment after adding variables
- Use `NEXT_PUBLIC_` prefix for browser-accessible vars

### Slow deployment
- First deployment takes 5-10 minutes
- Subsequent deployments are faster
- Check CloudWatch logs for details

---

## 🚀 Next Steps After Deployment

1. **Set up custom domain** (optional)
   - Go to Amplify Console
   - Click "Domain management"
   - Add your custom domain

2. **Enable auto-deployments**
   - Already enabled with GitHub integration
   - Every push to main branch auto-deploys

3. **Monitor performance**
   - Use Amplify Analytics
   - Monitor CloudWatch logs
   - Track API response times

4. **Set up CI/CD pipeline**
   - Amplify automatically handles this
   - Add branch-specific environments if needed

---

## 📞 Support

- **Amplify Docs:** https://docs.amplify.aws
- **AWS Console:** https://console.aws.amazon.com
- **GitHub Actions:** For advanced CI/CD

---

## ✨ What's Preserved

✅ All your existing code
✅ Firebase integration
✅ API routes
✅ Database connections
✅ File uploads
✅ Authentication
✅ Real-time features

**Nothing will break!** Your website will work exactly as it does locally, but hosted on AWS.

---

**Status:** Ready for deployment! 🎉
