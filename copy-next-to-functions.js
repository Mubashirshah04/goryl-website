const fs = require("fs-extra");
const path = require("path");
const util = require("util");

const source = path.join(__dirname, ".next");
const destination = path.join(__dirname, "functions", ".next");

async function copyFiles() {
  try {
    console.log("🚀 Preparing Next.js build for Firebase...");

    // Ensure the source directory exists
    if (!fs.existsSync(source)) {
      console.error(
        '❌ Error: .next directory not found. Please run "npm run build" first.',
      );
      process.exit(1);
    }

    // ✅ Verify BUILD_ID exists in source (required for production build)
    const buildIdPath = path.join(source, "BUILD_ID");
    if (!fs.existsSync(buildIdPath)) {
      console.error(
        '❌ Error: BUILD_ID file not found in .next directory. Production build is incomplete.',
      );
      console.error('   Expected path:', buildIdPath);
      console.error('   Please run "npm run build" to create a complete production build.');
      process.exit(1);
    }
    console.log('✅ BUILD_ID found:', fs.readFileSync(buildIdPath, "utf8").trim());

    // Clean up the destination directory
    if (fs.existsSync(destination)) {
      console.log("🗑️  Cleaning up old build in functions/.next...");
      await fs.remove(destination);
    }

    // Copy the .next directory to functions/.next with ALL files including vendor-chunks
    console.log(
      "📦 Copying .next build to functions/.next (including all server files)...",
    );
    await fs.copy(source, destination, {
      filter: (src, dest) => {
        const basename = path.basename(src);
        // Only exclude cache and trace files
        if (basename === "cache" || basename === "trace") {
          return false;
        }
        return true;
      },
    });

    // Fix the routesManifest.dataRoutes issue
    console.log("🛠️  Checking and fixing routesManifest.dataRoutes issue...");
    const requiredServerFilesPath = path.join(
      destination,
      "required-server-files.json",
    );

    if (fs.existsSync(requiredServerFilesPath)) {
      try {
        const requiredServerFiles = await fs.readJSON(requiredServerFilesPath);

        // Check if routesManifest exists and dataRoutes is not an array
        if (requiredServerFiles.routesManifest) {
          if (
            !requiredServerFiles.routesManifest.dataRoutes ||
            !Array.isArray(requiredServerFiles.routesManifest.dataRoutes)
          ) {
            console.log(
              "🔧 Fixing routesManifest.dataRoutes - setting to empty array",
            );
            requiredServerFiles.routesManifest.dataRoutes = [];
            await fs.writeJSON(requiredServerFilesPath, requiredServerFiles, {
              spaces: 2,
            });
            console.log("✅ routesManifest.dataRoutes successfully patched");
          } else {
            console.log(
              "✓ routesManifest.dataRoutes is already properly formatted",
            );
          }
        } else {
          console.log(
            "⚠️ No routesManifest found in required-server-files.json",
          );
        }
      } catch (err) {
        console.error(
          "⚠️ Error processing required-server-files.json:",
          err.message,
        );
      }
    } else {
      console.log("⚠️ required-server-files.json not found in .next build");
    }

    // ✅ Verify BUILD_ID was copied successfully
    const copiedBuildIdPath = path.join(destination, "BUILD_ID");
    if (!fs.existsSync(copiedBuildIdPath)) {
      console.error("❌ Error: BUILD_ID was not copied to functions/.next");
      process.exit(1);
    }
    console.log("✅ BUILD_ID verified in functions/.next:", fs.readFileSync(copiedBuildIdPath, "utf8").trim());

    console.log("✅ Successfully copied .next build to functions/.next");
    console.log("✅ All server files including vendor-chunks copied");
    console.log("✅ Production build verified and ready for deployment");
    console.log("🎉 Deployment preparation complete!");
  } catch (err) {
    console.error("❌ An error occurred during file copy:", err);
    process.exit(1);
  }
}

copyFiles();
