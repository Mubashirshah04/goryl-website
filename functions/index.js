const functions = require("firebase-functions");
const next = require("next");
const path = require("path");
const fs = require("fs");

// ✅ Import NextAuth API handler
const { nextauth } = require('./nextauth-api');

// ✅ Export NextAuth API function
exports.nextauth = nextauth;

// ✅ Force production mode for Firebase Functions
process.env.NODE_ENV = "production";
const dev = false;

// ✅ Safe load of required-server-files.json
let nextDir = path.resolve(__dirname, ".next");

// ✅ Verify BUILD_ID exists (required for production build)
const buildIdPath = path.join(nextDir, "BUILD_ID");
if (!fs.existsSync(buildIdPath)) {
  console.error("❌ BUILD_ID not found in .next directory. Production build is missing!");
  console.error("   Expected path:", buildIdPath);
  console.error("   Please run 'npm run build' before deploying.");
}

// ✅ Verify .next directory exists
if (!fs.existsSync(nextDir)) {
  console.error("❌ .next folder not found in functions directory:", nextDir);
  console.error("   Please run 'npm run build:firebase' to copy the build.");
}

try {
  const required = require("./.next/required-server-files.json");
  if (
    required &&
    required.config &&
    typeof required.config.distDir === "string"
  ) {
    nextDir = path.resolve(__dirname, required.config.distDir);
  } else {
    console.warn(
      "⚠️ distDir missing in required-server-files.json, using default .next",
    );
  }

  // Patch routesManifest if needed
  if (required && required.routesManifest) {
    if (
      !required.routesManifest.dataRoutes ||
      !Array.isArray(required.routesManifest.dataRoutes)
    ) {
      console.warn("⚠️ Patching missing or invalid routesManifest.dataRoutes");
      required.routesManifest.dataRoutes = [];
    }
  }
} catch (e) {
  console.warn(
    "⚠️ Could not read required-server-files.json, using default .next",
  );
}

// ✅ Verify .next directory and required files exist
if (!fs.existsSync(nextDir)) {
  console.error("❌ .next folder not found in functions directory:", nextDir);
  throw new Error("Production build not found. Run 'npm run build:firebase' first.");
}

// ✅ Verify BUILD_ID file exists
const buildIdFile = path.join(nextDir, "BUILD_ID");
if (!fs.existsSync(buildIdFile)) {
  console.error("❌ BUILD_ID file not found:", buildIdFile);
  throw new Error("Production build incomplete. BUILD_ID file is missing.");
}

console.log("✅ Production build verified. BUILD_ID:", fs.readFileSync(buildIdFile, "utf8").trim());

const nextConfigPath = path.join(__dirname, "../next.config.js");
if (!fs.existsSync(nextConfigPath)) {
  console.warn(
    "⚠️ No next.config.js found in root (optional, but recommended)",
  );
}

// ✅ Load Next.js app with better error handling
const nextApp = next({
  dev: false, // Always production mode in Firebase Functions
  conf: {
    distDir: nextDir,
    // Prevent certain errors by disabling features that might cause issues
    experimental: {
      appDir: true,
    },
  },
});

const handle = nextApp.getRequestHandler();

// ✅ Professional-level Firebase Function with performance optimizations
let isPrepared = false;
const prepareApp = async () => {
  if (!isPrepared) {
    await nextApp.prepare();
    isPrepared = true;
  }
};

// ✅ Use the correct Firebase Functions syntax with improved error handling
exports.nextjs = functions.https.onRequest(async (req, res) => {
  try {
    // Ensure app is prepared (only once)
    await prepareApp();

    // ✅ Special handling for API routes (including NextAuth)
    if (req.url.startsWith('/api/')) {
      console.log('🔐 API Route Request:', req.url);
      
      // Don't set cache headers for API routes
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("X-Powered-By", "Next.js + Firebase");
      
      // Ensure JSON content type for API routes
      if (req.url.includes('/auth/')) {
        res.setHeader("Content-Type", "application/json");
      }
    } else {
      // Add professional performance headers for pages
      res.setHeader(
        "Cache-Control",
        "public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400",
      );
      res.setHeader("X-Powered-By", "Next.js + Firebase");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
    }

    console.log("🚀 Request:", req.method, req.url);

    // Safer handling of requests
    await new Promise((resolve, reject) => {
      handle(req, res)
        .then(resolve)
        .catch((err) => {
          // Specific handling for the dataRoutes error
          if (
            err &&
            err.message &&
            err.message.includes("routesManifest.dataRoutes is not iterable")
          ) {
            console.warn("🛠️ Handling known routesManifest.dataRoutes error");
            res.status(200).send(`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta http-equiv="refresh" content="0;URL='/'">
                  <title>Redirecting...</title>
                </head>
                <body>
                  <p>Redirecting to homepage...</p>
                </body>
              </html>
            `);
            resolve();
          } else {
            reject(err);
          }
        });
    });
  } catch (err) {
    console.error("🔥 Firebase Next.js SSR Error:", err);

    // Handle specific known errors
    if (
      err &&
      err.message &&
      err.message.includes("routesManifest.dataRoutes is not iterable")
    ) {
      console.warn("🛠️ Catching known routesManifest.dataRoutes error");
      return res.redirect("/");
    }

    res.status(500).send("Internal Server Error: " + err.message);
  }
});
