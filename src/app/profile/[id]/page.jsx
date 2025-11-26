import ProfilePageClient from '../page-client';
// Generate static params - no Firestore access during build
export async function generateStaticParams() {
    // Return demo users only - real users will be loaded dynamically
    return [
        { id: 'demo-user-1' },
        { id: 'demo-user-2' },
        { id: 'demo-user-3' },
        { id: 'e8RMNA4TE2N8fUHVsYir6zqffwI3' },
        { id: 'eigcHWVee4T2KTvFtuvd2tqVUfR2' },
        { id: 'user-001' },
        { id: 'user-002' },
        { id: 'user-003' },
        { id: 'admin-user' },
        { id: 'seller-user' },
        { id: 'brand-user' },
        { id: 'company-user' }
    ];
}
export default async function ProfileIdPage({ params }) {
    const { id } = await params;
    return <ProfilePageClient uid={id}/>;
}
