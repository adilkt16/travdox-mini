// Geographic utilities and GeoJSON matching for Layover Passport Atlas
import { COUNTRIES } from '../data/countries'

export const STAMP_COLORS = [
  '#2A4B9B', // Blue (common)
  '#B23A2B', // Red (rare)
  '#2F6B4F', // Green
  '#5B3F8C', // Violet
]

/**
 * Deterministically pick a stamp ink color by hashing the iso2 code.
 */
export function getStampColor(iso2) {
  if (!iso2) return STAMP_COLORS[0]
  const clean = String(iso2).toUpperCase()
  let hash = 0
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0
  }
  return STAMP_COLORS[hash % STAMP_COLORS.length]
}

/**
 * Convert a hex color string to rgba format with the given alpha.
 */
export function hexToRgba(hex, alpha = 0.85) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Match a Natural Earth GeoJSON feature to its ISO-2 country code.
 * Handles known Natural Earth 110m quirks:
 * - France and Norway use ISO_A2 = '-99'
 * - ISO_A2_EH / ADM0_A3 / ISO_A3 fallbacks
 */
export function getFeatureIso2(feature) {
  if (!feature || !feature.properties) return null
  const p = feature.properties

  // Primary standard codes
  if (p.ISO_A2_EH && p.ISO_A2_EH !== '-99') return p.ISO_A2_EH.toUpperCase()
  if (p.ISO_A2 && p.ISO_A2 !== '-99') return p.ISO_A2.toUpperCase()

  // Natural Earth -99 gotchas
  if (p.ADM0_A3 === 'FRA' || p.ISO_A3 === 'FRA' || p.NAME === 'France') return 'FR'
  if (p.ADM0_A3 === 'NOR' || p.ISO_A3 === 'NOR' || p.NAME === 'Norway') return 'NO'
  if (p.ADM0_A3 === 'KOS') return 'XK'

  return null
}

/**
 * Pre-indexed map of countries by ISO2 code
 */
export const COUNTRIES_BY_ISO2 = new Map(
  COUNTRIES.map((c) => [c.iso2.toUpperCase(), c])
)

/**
 * Match a GeoJSON feature to a country record in src/data/countries.js
 */
export function getCountryForFeature(feature) {
  const iso2 = getFeatureIso2(feature)
  if (!iso2) return null
  return COUNTRIES_BY_ISO2.get(iso2) || null
}

/**
 * Identify countries in src/data/countries.js with no polygon in the 110m GeoJSON.
 * These will be rendered as ink-dot points at their lat/lng.
 */
export function getMissingCountriesWithNoPolygon(features = []) {
  const polygonIsoSet = new Set()
  for (const f of features) {
    const iso2 = getFeatureIso2(f)
    if (iso2) polygonIsoSet.add(iso2)
  }

  return COUNTRIES.filter((c) => !polygonIsoSet.has(c.iso2.toUpperCase()))
}
