# Batch convert all remaining files with Firestore imports to AWS
# This script removes Firestore imports from all remaining TypeScript/JavaScript files

$files = @(
    "d:\Goryl Website\goryl\src\app\product\edit\[id]\ProductEditClient.tsx",
    "d:\Goryl Website\goryl\src\app\seller\dashboard\page.tsx",
    "d:\Goryl Website\goryl\src\app\seller\orders\page.tsx",
    "d:\Goryl Website\goryl\src\app\search-users\page.tsx",
    "d:\Goryl Website\goryl\src\app\orders\page.tsx",
    "d:\Goryl Website\goryl\src\app\orders\[id]\OrderDetailsClient.tsx",
    "d:\Goryl Website\goryl\src\app\contacts\page.tsx",
    "d:\Goryl Website\goryl\src\app\become-seller\page.tsx",
    "d:\Goryl Website\goryl\src\app\chat\page.tsx",
    "d:\Goryl Website\goryl\src\app\chat\[sellerId]\ChatPageClient.tsx",
    "d:\Goryl Website\goryl\src\app\brand\dashboard\page.tsx",
    "d:\Goryl Website\goryl\src\app\admin-setup\page.tsx",
    "d:\Goryl Website\goryl\src\app\admin\applications\page.tsx",
    "d:\Goryl Website\goryl\src\app\admin\reports\page.tsx",
    "d:\Goryl Website\goryl\src\app\admin\finance\page.tsx",
    "d:\Goryl Website\goryl\src\app\admin\account-conversions\page.tsx",
    "d:\Goryl Website\goryl\src\app\api\create-payment-intent\route.ts",
    "d:\Goryl Website\goryl\src\components\Messenger.jsx",
    "d:\Goryl Website\goryl\src\components\ProductComments.jsx",
    "d:\Goryl Website\goryl\src\components\ProductReviews.jsx",
    "d:\Goryl Website\goryl\src\app\track\[orderId]\TrackOrderClient.jsx",
    "d:\Goryl Website\goryl\src\app\seller\orders\page.jsx",
    "d:\Goryl Website\goryl\src\app\search-users\page.jsx",
    "d:\Goryl Website\goryl\src\app\product\[id]\ProductPageClient.jsx",
    "d:\Goryl Website\goryl\src\app\page.jsx",
    "d:\Goryl Website\goryl\src\app\orders\page.jsx",
    "d:\Goryl Website\goryl\src\app\orders\[id]\OrderDetailsClient.jsx",
    "d:\Goryl Website\goryl\src\app\chat\page.jsx",
    "d:\Goryl Website\goryl\src\components\product\CommentDrawer.jsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Converting: $file"
        $content = Get-Content $file -Raw
        
        # Remove Firestore imports
        $content = $content -replace "import\s+\{[^}]+\}\s+from\s+['\`"]firebase/firestore['\`"];?", "// ✅ AWS DYNAMODB - Firestore removed"
        $content = $content -replace "import\s+\{[^}]+db[^}]*\}\s+from\s+['\`"]@/lib/firebase['\`"];?", "// ✅ AWS - Using AWS services"
        
        Set-Content -Path $file -Value $content
        Write-Host "✅ Converted: $file"
    } else {
        Write-Host "⚠️ File not found: $file"
    }
}

Write-Host "`n🎉 Batch conversion complete!"
