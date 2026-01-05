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
<ellipse cx="${center}" cy="${bodyY + bodyHeight/2}" rx="${bodyWidth/2}" ry="${bodyHeight/2}"/>
</g>
</svg>`;
  
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
