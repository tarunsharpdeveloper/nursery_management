/**
 * Image URL utilities for development/production compatibility
 * 
 * Handles the case where images are stored with production URLs
 * but we're running in development mode
 */

export function getImageUrl(url: string): string {
  if (!url) return "";
  
  // If already a complete URL (http/https), return as-is
  if (url.startsWith("http")) return url;
  
  // If it's a data URL or blob URL, return as-is
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  
  // If it starts with /, it's already a path - return as-is for Next.js to handle
  if (url.startsWith("/")) return url;
  
  // Otherwise, it's a filename - prefix with /uploads/
  return `/uploads/${url}`;
}

export function getProductImageUrl(mediaUrls: string | null): string {
  if (!mediaUrls) return "";
  
  try {
    const parsed = JSON.parse(mediaUrls);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
      return getImageUrl(parsed[0]);
    }
  } catch {
    return getImageUrl(mediaUrls);
  }
  
  return "";
}

export function getAllProductImages(mediaUrls: string | null): string[] {
  if (!mediaUrls) return [];
  
  try {
    const parsed = JSON.parse(mediaUrls);
    if (Array.isArray(parsed)) {
      return parsed.filter(url => url).map(url => getImageUrl(url));
    }
  } catch {
    return [getImageUrl(mediaUrls)];
  }
  
  return [];
}