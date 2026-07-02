import ProductDetailsClient from "./ProductDetailsClient";

type ProductParam = {
  id: string;
};

// Dynamic mode - no static generation
export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<ProductParam>;
}) {
  // Await params in server component
  const { id } = await params;
  
  return <ProductDetailsClient id={id} />;
}
