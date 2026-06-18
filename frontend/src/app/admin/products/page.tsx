"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";
import { apiRequest } from "@/lib/api";

type Category = {
  id: number;
  parent_id?: number | null;
  name: string;
  is_active?: number | boolean;
};

function categoryLabel(category: Category, categories: Category[]) {
  const parent = category.parent_id ? categories.find((item) => item.id === category.parent_id) : null;
  return parent ? `${parent.name} / ${category.name}` : category.name;
}

export default function AdminProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    apiRequest<Category[]>("/api/categories")
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  const categoryOptions = useMemo(
    () => categories
      .filter((category) => category.is_active !== false && category.is_active !== 0)
      .sort((a, b) => categoryLabel(a, categories).localeCompare(categoryLabel(b, categories)))
      .map((category) => ({ label: categoryLabel(category, categories), value: category.id })),
    [categories]
  );

  return (
    <AdminShell>
      <AdminModule
        eyebrow="Product Management"
        title="Plants and Seeds"
        listPath="/api/products"
        submitPath="/api/products"
        submitLabel="Save Product"
        fields={[
          { name: "categoryId", label: "Category", type: "select", valueType: "number", options: categoryOptions },
          { name: "productType", label: "Type", type: "select", options: [{ label: "Plant", value: "plant" }, { label: "Seed", value: "seed" }] },
          { name: "name", label: "Product Name", placeholder: "Product name" },
          { name: "sellingPrice", label: "Selling Price", type: "number", valueType: "number" },
          { name: "availableQuantity", label: "Opening Stock", type: "number", valueType: "number" },
          { name: "photoUrl", label: "Photo URL", placeholder: "https://..." },
          { name: "description", label: "Description", type: "textarea" }
        ]}
        columns={[
          { key: "name", label: "Product" },
          { key: "product_type", label: "Type" },
          { key: "category", label: "Category" },
          { key: "selling_price", label: "Price" },
          { key: "available_quantity", label: "Stock" },
          { key: "is_active", label: "Active" }
        ]}
      />
    </AdminShell>
  );
}
