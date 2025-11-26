@echo off
echo 🎵 Deploying Music API Cloud Functions...

cd functions

echo 📦 Installing dependencies...
npm install

echo 🚀 Deploying Cloud Functions...
firebase deploy --only functions:getTrendingSongs,functions:searchMusic

echo ✅ Music API deployed successfully!
echo 🌐 Trending API: https://us-central1-your-project-id.cloudfunctions.net/getTrendingSongs
echo 🔍 Search API: https://us-central1-your-project-id.cloudfunctions.net/searchMusic

pause

