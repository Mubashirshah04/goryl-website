# ✅ Amplify Gen 2 Deployment Checklist

## Pre-Deployment (Do Once)

- [ ] AWS IAM user has SSM permissions (added policy)
- [ ] Region ap-south-1 is bootstrapped
- [ ] GitHub repository created and code pushed
- [ ] GitHub personal access token generated

## Code Preparation

- [ ] `next.config.js` has `output: "standalone"`
- [ ] `.env.production` created with all variables
- [ ] `.gitignore` includes `.env.local` (don't commit secrets)
- [ ] `amplify.yml` is configured
- [ ] `amplify/` directory exists with backend config

## Deployment Steps

### Option A: GitHub + Amplify Console (Easiest)

1. [ ] Push code to GitHub
   ```bash
   git add .
   git commit -m "Ready for Amplify deployment"
   git push origin main
   ```

2. [ ] Go to AWS Amplify Console
   - https://console.aws.amazon.com/amplify

3. [ ] Click "Create app" → "GitHub"
   - Authorize GitHub
   - Select repository
   - Select main branch
   - Click "Save and deploy"

4. [ ] Wait for build to complete (5-10 minutes)

5. [ ] Get your live URL from Amplify Console

### Option B: Amplify CLI

1. [ ] Run deployment command
   ```bash
   amplify hosting add
   amplify publish
   ```

2. [ ] Follow prompts
3. [ ] Wait for deployment
4. [ ] Get live URL

## Post-Deployment Testing

- [ ] Website loads at live URL
- [ ] Home page displays products
- [ ] Search works
- [ ] Product pages load
- [ ] Add to cart works
- [ ] Checkout process works
- [ ] User authentication works
- [ ] File uploads work
- [ ] Real-time features work

## Environment Variables (In Amplify Console)

- [ ] NEXT_PUBLIC_FIREBASE_API_KEY
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- [ ] NEXT_PUBLIC_AWS_REGION
- [ ] NEXT_PUBLIC_S3_BUCKET_NAME
- [ ] Any other NEXT_PUBLIC_* variables

## Security Check

- [ ] HTTPS enabled (automatic)
- [ ] Secrets not in code
- [ ] Environment variables set in Amplify
- [ ] GitHub repo is private (if needed)
- [ ] No sensitive data in commits

## Optional: Custom Domain

- [ ] Domain registered (GoDaddy, Route53, etc.)
- [ ] Domain connected in Amplify Console
- [ ] SSL certificate auto-generated
- [ ] DNS records updated

## Monitoring

- [ ] CloudWatch logs accessible
- [ ] Amplify Analytics enabled
- [ ] Error tracking set up
- [ ] Performance metrics monitored

---

## 🎉 Deployment Complete!

Once all items are checked, your website is live on AWS Amplify Hosting with Gen 2!

**Live URL:** `https://your-app.amplifyapp.com`

Every push to main branch will auto-deploy! 🚀
