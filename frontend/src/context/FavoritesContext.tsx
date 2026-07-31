"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useCustomerAuth } from "./CustomerAuthContext";
import { useToast } from "./ToastContext";
import { apiRequest, getMediaUrl } from "@/lib/api";
import type { Product } from "@/lib/types";

interface BackendProduct {
  id: number;
  name: string;
  product_type: string;
  category: string;
  description: string | null;
  selling_price: number;
  actual_price: number;
  available_quantity: number;
  unit: string | null;
  photo_url: string | null;
  media_urls: string | null;
  is_active: boolean;
  favorited_at?: string;
}

interface FavoritesContextType {
  favoriteIds: number[];
  favoritesList: Product[];
  loading: boolean;
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (product: { id: number; name: string }, event?: React.MouseEvent) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
  favoriteCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useCustomerAuth();
  const { showToast } = useToast();
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [favoritesList, setFavoritesList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!token && typeof window !== "undefined" && !localStorage.getItem("customer_token")) {
      setFavoriteIds([]);
      setFavoritesList([]);
      return;
    }

    try {
      setLoading(true);
      const data = await apiRequest<{ favoriteIds: number[]; favorites: BackendProduct[] }>(
        "/api/favorites",
        { skipAuthRedirect: true }
      );
      
      const ids = data.favoriteIds || [];
      setFavoriteIds(ids);

      const transformed: Product[] = (data.favorites || []).map((p) => {
        const FALLBACK_IMG = "https://dms.mydukaan.io/original/jpeg/media/54ecc558-e85c-462a-b5e5-692caad96f53.jpg";
        let resolvedImage = p.photo_url || FALLBACK_IMG;
        if (p.media_urls) {
          try {
            const parsed = JSON.parse(p.media_urls);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
              resolvedImage = parsed[0];
            }
          } catch {
            if (p.media_urls) resolvedImage = p.media_urls;
          }
        }

        return {
          id: p.id,
          name: p.name,
          type: (p.product_type as "plant" | "seed") || "plant",
          category: p.category,
          description: p.description || "",
          price: Number(p.selling_price),
          stock: Number(p.available_quantity),
          sold: 0,
          image: getMediaUrl(resolvedImage),
          active: Boolean(p.is_active)
        };
      });

      setFavoritesList(transformed);
    } catch (err) {
      setFavoriteIds([]);
      setFavoritesList([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isFavorite = useCallback(
    (productId: number) => {
      return favoriteIds.includes(Number(productId));
    },
    [favoriteIds]
  );

  const toggleFavorite = async (product: { id: number; name: string }, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("customer_token") : null);

    if (!currentToken) {
      showToast("Please login to add items to your favourites!", "warning");
      return false;
    }

    try {
      const response = await apiRequest<{ isFavorite: boolean; message: string; favoriteIds: number[] }>(
        "/api/favorites/toggle",
        {
          method: "POST",
          body: JSON.stringify({ productId: product.id }),
          skipAuthRedirect: true
        }
      );

      if (response.favoriteIds) {
        setFavoriteIds(response.favoriteIds);
      }

      if (!response.isFavorite && response.message?.toLowerCase().includes("login")) {
        showToast(response.message, "warning");
        if (typeof window !== "undefined") {
          localStorage.removeItem("customer_token");
          localStorage.removeItem("customer_user");
        }
        return false;
      }

      if (response.isFavorite) {
        showToast(`"${product.name}" added to favourites! ❤️`, "success");
      } else {
        showToast(`"${product.name}" removed from favourites`, "info");
      }

      // Refresh list to update Profile page / Wishlist page
      loadFavorites();

      return response.isFavorite;
    } catch (err: any) {
      const msg = err?.message || "Please login to add items to your favourites!";
      if (msg.toLowerCase().includes("login") || msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("unauthorized")) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("customer_token");
          localStorage.removeItem("customer_user");
        }
      }
      showToast(msg, "warning");
      return isFavorite(product.id);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        favoritesList,
        loading,
        isFavorite,
        toggleFavorite,
        refreshFavorites: loadFavorites,
        favoriteCount: favoriteIds.length
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
