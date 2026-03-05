/**
 * Resolves image URLs for display.
 *
 * The backend now stores relative paths for all uploads:
 *   /api/garage/uploads/cars/car-123.jpg
 *   /api/garage/uploads/posts/post-123.jpg
 *   /api/garage/uploads/garage-covers/cover-123.jpg
 *
 * This function turns a relative path into a full URL using the API origin
 * so it works the same in dev (localhost:8080) and production (your domain).
 *
 * Legacy rows in the DB that already have full http://localhost:8080/... URLs
 * are also handled gracefully.
 */

function getApiOrigin() {
  try {
    if (import.meta.env.VITE_API_URL) {
      return new URL(import.meta.env.VITE_API_URL).origin;
    }
  } catch {
    /* invalid VITE_API_URL */
  }
  return "http://localhost:8080";
}

export function resolveImageUrl(url, fallback = null) {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // Relative path (new uploads) — just prepend API origin
  if (trimmed.startsWith("/")) {
    return `${getApiOrigin()}${trimmed}`;
  }

  // Full URL (https or legacy http) — return as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return fallback;
}
