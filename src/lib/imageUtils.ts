/**
 * Utility: parse a product imageUrl field into an array of valid URLs.
 *
 * Supports two storage formats:
 *  1. NEW: JSON array string  -> '["url1","url2"]'
 *  2. LEGACY: plain https:// or /uploads/... single URL (no commas in value)
 *
 * NOTE: We intentionally do NOT split by comma because
 *       data:image/webp;base64,<data> itself contains a comma.
 */

const VALID_PREFIXES = ['http://', 'https://', '/', 'data:image/'];

export const isValidImageUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (t.length < 8) return false;
  return VALID_PREFIXES.some((p) => t.startsWith(p));
};

/**
 * Parse imageUrl field → string[]
 * Falls back to [] if nothing valid found.
 */
export const parseImageUrls = (imageUrl?: string | null): string[] => {
  if (!imageUrl || typeof imageUrl !== 'string') return [];
  const raw = imageUrl.trim();
  if (!raw) return [];

  // 1. Try JSON array format: ["url1","url2"]
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((s) => String(s).trim()).filter(isValidImageUrl);
      }
    } catch {
      // fall through
    }
  }

  // 2. Single URL (legacy plain string — no comma splitting!)
  if (isValidImageUrl(raw)) {
    return [raw];
  }

  return [];
};

/**
 * Get the first valid image URL or a fallback placeholder.
 */
export const getFirstImageUrl = (
  imageUrl?: string | null,
  fallback = '/placeholder-product.svg'
): string => {
  const urls = parseImageUrls(imageUrl);
  return urls[0] || fallback;
};

/**
 * Get all image URLs for a product, falling back to the lazy image endpoint.
 */
export const getProductImageUrls = (
  product?: { id: string; imageUrl?: string | null } | null,
  fallback = '/placeholder-product.svg'
): string[] => {
  if (!product) return [fallback];
  const urls = parseImageUrls(product.imageUrl);
  if (urls.length > 0) return urls;
  return [`/api/products/${product.id}/image` || fallback];
};

/**
 * Get the main image URL for a product, falling back to the lazy image endpoint.
 */
export const getProductImageUrl = (
  product?: { id: string; imageUrl?: string | null } | null,
  fallback = '/placeholder-product.svg'
): string => {
  return getProductImageUrls(product, fallback)[0];
};

/**
 * Serialize an array of URLs to the JSON storage format.
 */
export const serializeImageUrls = (urls: string[]): string => {
  const valid = urls.filter(isValidImageUrl);
  if (valid.length === 0) return '';
  if (valid.length === 1) return valid[0]; // single URL stored as plain string (backwards compat)
  return JSON.stringify(valid);
};
