import type React from "react";

/**
 * High-resolution agricultural biomass photography mapped to each specific residue type.
 */
export const WASTE_FALLBACK_IMAGES: Record<string, string> = {
  paddy_straw: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
  wheat_straw: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
  rice_husk: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
  mustard_stubble: "https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=800&q=80",
  sugarcane_trash: "https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=800&q=80",
  cashew_shell: "https://images.unsplash.com/photo-1569466896818-335b1bedfcce?auto=format&fit=crop&w=800&q=80",
  cotton_stalk: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=800&q=80",
  groundnut_shell: "https://images.unsplash.com/photo-1567892320421-1c657571ea4a?auto=format&fit=crop&w=800&q=80",
  bagasse: "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=800&q=80",
};

export const WASTE_IMAGES = WASTE_FALLBACK_IMAGES;

/**
 * Normalizes wasteType to standard snake_case key
 */
export function normalizeWasteKey(wasteType?: string | null): string {
  if (!wasteType) return "paddy_straw";
  return wasteType.toLowerCase().trim().replace(/[-\s]+/g, "_");
}

/**
 * Returns the primary local image path for a given waste type.
 * Uses the user's placed local photography in /images/residues/${key}.jpg.
 */
export function getWasteImage(wasteType?: string | null): string {
  const key = normalizeWasteKey(wasteType);
  return `/images/residues/${key}.jpg`;
}

/**
 * Universal fallback handler for <img> tags.
 * Cascades: Local JPG -> Online CDN -> Default Paddy Straw JPG.
 * Ensures an image is NEVER blank or broken.
 */
export function handleWasteImageError(
  e: React.SyntheticEvent<HTMLImageElement>,
  wasteType?: string | null
) {
  const key = normalizeWasteKey(wasteType);
  const img = e.currentTarget;
  if (!img.dataset.failedLocal) {
    img.dataset.failedLocal = "true";
    img.src = WASTE_FALLBACK_IMAGES[key] || WASTE_FALLBACK_IMAGES.paddy_straw;
  } else if (!img.dataset.failedFallback) {
    img.dataset.failedFallback = "true";
    img.src = "/images/residues/paddy_straw.jpg";
  }
}
