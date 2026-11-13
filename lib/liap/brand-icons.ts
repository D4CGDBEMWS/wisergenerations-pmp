// ---------------------------------------------------------------------------
// The Living Is a Project icon set. Owner request, 2026-11-04: the results
// report and emails felt impersonal, with no icons or pictures.
//
// One stroke style (24-unit grid, 1.8 stroke, round joins) so the set reads as
// a family beside the campaign's gold road and crown art. Paths only, so the
// same source draws the web icons (inline SVG) and the email icons (PNG files
// in public/liap/brand/icons, rendered from this list by
// scripts/render-brand-icons.mjs, because most email apps block SVG).
// ---------------------------------------------------------------------------

export const BRAND_ICONS = {
  // Eight dimensions
  vision: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3.2"/>',
  time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  money: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>',
  career: '<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2"/><path d="M3 12.5h18"/>',
  relationships: '<circle cx="8.5" cy="8.5" r="3"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M3 19c.6-3 2.9-5 5.5-5s4.9 2 5.5 5"/><path d="M14.5 14.3c2.6-.4 5 1.3 5.8 4.2"/>',
  risk: '<path d="M12 3l8 3v6c0 4.6-3.3 7.9-8 9-4.7-1.1-8-4.4-8-9V6l8-3z"/><path d="M8.8 12.2l2.2 2.2 4.3-4.5"/>',
  wellness: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/><path d="M8 12h2l1.2-2 1.6 4 1.2-2h2"/>',
  legacy: '<path d="M12 21v-8"/><path d="M12 13c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5z"/><path d="M12 15.5c0-3.3-2.5-5.5-6-5.5 0 3.3 2.5 5.5 6 5.5z"/><path d="M7 21h10"/>',
  // Next best three
  protect: '<path d="M12 3l8 3v6c0 4.6-3.3 7.9-8 9-4.7-1.1-8-4.4-8-9V6l8-3z"/>',
  resolve: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3"/>',
  move: '<path d="M3.5 18.5c4.5 0 4.5-5 8.5-5s4-5 8.5-5"/><path d="M17.5 5.5l3 3-3 3"/>',
  // Page sections
  plan: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9.5h16M9 3v4M15 3v4"/><path d="M8 13.5h3M8 16.5h6"/>',
  strengths: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8-4.3-4.1 5.9-.9L12 3.5z"/>',
  attention: '<path d="M12 4l9 16H3l9-16z"/><path d="M12 10v4.5M12 17.2v.01"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6.5L20.5 7"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19.5h14"/>',
  workshop: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20"/><circle cx="12" cy="9.5" r="2"/><path d="M8.8 14c.6-1.4 1.8-2.2 3.2-2.2s2.6.8 3.2 2.2"/>',
  kit: '<path d="M4 8h16v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M4 12.5h16"/>',
} as const

export type BrandIconName = keyof typeof BRAND_ICONS

/** A complete SVG document for one icon. */
export function brandIconSvg(name: BrandIconName, color = '#A86F14', size = 24): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${BRAND_ICONS[name]}</svg>`
}
