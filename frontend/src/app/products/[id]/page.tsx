import ProductDetailsClient from "./ProductDetailsClient";

type ProductParam = {
  id: string;
};

type ProductIdResponse = Array<{
  id: number | string;
}>;

async function getProductIds(): Promise<ProductParam[]> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  try {
    const response = await fetch(`${apiBaseUrl}/api/products`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const products = (await response.json()) as ProductIdResponse;
    return products
      .filter((product) => product.id !== undefined && product.id !== null)
      .map((product) => ({ id: String(product.id) }));
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  return getProductIds();
}

export default function ProductDetailsPage({
  params,
}: {
  params: Promise<ProductParam>;
}) {
  return <ProductDetailsClient params={params} />;
}
