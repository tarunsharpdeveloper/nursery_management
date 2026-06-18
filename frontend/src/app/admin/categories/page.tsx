"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Power, PowerOff, RefreshCw, Tags } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { apiRequest } from "@/lib/api";

type Category = {
  id: number;
  parent_id: number | null;
  name: string;
  description: string | null;
  is_active: number | boolean;
  parent_name: string | null;
  child_count: number;
  product_count: number;
};

type CategoryNode = Category & {
  children: CategoryNode[];
};

function isActive(category: Category) {
  return Boolean(category.is_active);
}

function buildTree(categories: Category[]) {
  const nodes = new Map<number, CategoryNode>();
  const roots: CategoryNode[] = [];

  categories.forEach((category) => {
    nodes.set(category.id, { ...category, children: [] });
  });

  nodes.forEach((node) => {
    if (node.parent_id && nodes.has(node.parent_id)) {
      nodes.get(node.parent_id)?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (items: CategoryNode[]) => {
    items.sort((a, b) => a.name.localeCompare(b.name));
    items.forEach((item) => sortNodes(item.children));
  };

  sortNodes(roots);
  return roots;
}

function CategoryBranch({ node, onToggle, busy }: { node: CategoryNode; onToggle: (category: Category) => void; busy: boolean }) {
  return (
    <li className="tree-node">
      <div className="tree-node-row">
        <div>
          <strong>{node.name}</strong>
          <p className="meta">
            {node.parent_name ? `Under ${node.parent_name}` : "Top-level category"} - {node.product_count} products - {node.child_count} subcategories
          </p>
          {node.description ? <p className="meta">{node.description}</p> : null}
        </div>
        <button className="button secondary" type="button" onClick={() => onToggle(node)} disabled={busy}>
          {isActive(node) ? <PowerOff size={16} /> : <Power size={16} />}
          {isActive(node) ? "Deactivate" : "Activate"}
        </button>
      </div>
      {node.children.length ? (
        <ul className="tree-list">
          {node.children.map((child) => (
            <CategoryBranch key={child.id} node={child} onToggle={onToggle} busy={busy} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ parentId: "", name: "", description: "" });
  const [status, setStatus] = useState("Loading categories...");
  const [busy, setBusy] = useState(false);

  const tree = useMemo(() => buildTree(categories), [categories]);
  const parentOptions = useMemo(
    () => categories.filter((category) => isActive(category)).sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  async function loadCategories() {
    setBusy(true);
    try {
      const data = await apiRequest<Category[]>("/api/categories");
      setCategories(Array.isArray(data) ? data : []);
      setStatus(`Loaded ${Array.isArray(data) ? data.length : 0} categories`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load categories");
      setCategories([]);
    } finally {
      setBusy(false);
    }
  }

  async function createCategory() {
    setBusy(true);
    try {
      await apiRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          parentId: form.parentId ? Number(form.parentId) : null,
          name: form.name,
          description: form.description
        })
      });
      setForm({ parentId: "", name: "", description: "" });
      setStatus("Category saved");
      await loadCategories();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save category");
    } finally {
      setBusy(false);
    }
  }

  async function toggleCategory(category: Category) {
    setBusy(true);
    try {
      await apiRequest("/api/categories/toggle", {
        method: "PATCH",
        body: JSON.stringify({ categoryId: category.id, isActive: !isActive(category) })
      });
      setStatus(`${category.name} ${isActive(category) ? "deactivated" : "activated"}`);
      await loadCategories();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update category");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <AdminShell>
      <div className="section-header">
        <div>
          <p className="eyebrow">Category Management</p>
          <h1>Category Tree</h1>
          <p className="meta">{status}</p>
        </div>
        <button className="button secondary" type="button" onClick={loadCategories} disabled={busy}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <form className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div className="form-grid">
            <label className="field">
              <span>Parent Category</span>
              <select value={form.parentId} onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value }))}>
                <option value="">Top-level</option>
                {parentOptions.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Category Name</span>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Category name" />
            </label>
            <label className="field">
              <span>Description</span>
              <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Optional notes" />
            </label>
          </div>
          <button className="button" type="button" onClick={createCategory} disabled={busy || form.name.trim().length < 2} style={{ marginTop: 16 }}>
            <Plus size={17} />
            Add Category
          </button>
        </div>
      </form>

      <div className="tree-panel">
        <div className="tree-panel-header">
          <Tags size={18} />
          <strong>Categories</strong>
        </div>
        {tree.length ? (
          <ul className="tree-list tree-list-root">
            {tree.map((node) => (
              <CategoryBranch key={node.id} node={node} onToggle={toggleCategory} busy={busy} />
            ))}
          </ul>
        ) : (
          <p className="meta">No categories found</p>
        )}
      </div>
    </AdminShell>
  );
}
