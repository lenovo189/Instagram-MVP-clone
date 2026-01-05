import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates an Instagram-style default avatar SVG as a data URI
 * The avatar adapts to light/dark themes using prefers-color-scheme media query
 * @param size - Size of the avatar (default: 150)
 * @returns Data URI string for the SVG avatar
 */
export function getDefaultAvatar(size: number = 150): string {
  // Instagram-style avatar: circular background with user icon silhouette
  // Uses prefers-color-scheme to adapt to system theme
  const center = size / 2;
  const headRadius = size * 0.2;
  const headY = center - size * 0.05;
  const bodyY = headY + headRadius + size * 0.03;
  const bodyHeight = size * 0.3;
  const bodyWidth = size * 0.45;

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
<defs>
<style>
.avatar-bg { fill: #dbdbdb; }
.avatar-icon { fill: #8e8e8e; }
@media (prefers-color-scheme: dark) {
  .avatar-bg { fill: #262626; }
  .avatar-icon { fill: #a8a8a8; }
}
</style>
</defs>
<circle cx="${center}" cy="${center}" r="${center}" class="avatar-bg"/>
<g class="avatar-icon">
<circle cx="${center}" cy="${headY}" r="${headRadius}"/>
<ellipse cx="${center}" cy="${bodyY + bodyHeight / 2}" rx="${bodyWidth / 2}" ry="${bodyHeight / 2}"/>
</g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
/**
 * Robustly determines the site URL for redirects.
 * It checks for environment variables and falls back to window.location.origin.
 */
export function getURL() {
  // Use NEXT_PUBLIC_DEV flag for explicit development mode
  if (process.env.NEXT_PUBLIC_DEV === 'true') {
    return 'http://localhost:3000/';
  }

  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your production URL
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel
    'http://localhost:3000/';

  // If we are on the client, use the current origin
  if (typeof window !== 'undefined') {
    url = window.location.origin;
  }

  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;

  return url;
}
