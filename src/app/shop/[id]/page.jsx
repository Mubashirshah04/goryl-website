import ShopPageClient from './page-client';
// Generate static params - no Firestore access during build
export async function generateStaticParams() {
    // Return demo shops only - real shops will be loaded dynamically
    return [
        { id: 'demo-shop-1' },
        { id: 'demo-shop-2' },
        { id: 'e8RMNA4TE2N8fUHVsYir6zqffwI3' },
        { id: 'eigcHWVee4T2KTvFtuvd2tqVUfR2' },
        { id: 'seller-001' },
        { id: 'brand-001' },
        { id: 'company-001' }
    ];
}
export default async function ShopPage({ params }) {
    const { id } = await params;
    return <ShopPageClient shopId={id}/>;
}
