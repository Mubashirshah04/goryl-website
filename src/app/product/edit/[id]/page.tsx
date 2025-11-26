import ProductEditClient from './ProductEditClient';

// Required for static export with dynamic routes
export async function generateStaticParams() {
  // Return empty array for dynamic routes that don't need pre-generation
  return [];
}

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditClient productId={id} />;
}
