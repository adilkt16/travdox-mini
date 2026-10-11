/**
 * Exchange Code — Format: "LC1." + base64url of compact payload
 *
 * Payload schema (JSON):
 * {
 *   v: 1,               // version
 *   n: string,          // name, max 20 chars
 *   h: string,          // home iso2
 *   b: string,          // visited bitset as hex string (195 bits → 25 bytes)
 *   f: number,          // totalFinds
 *   r: number,          // rareCount
 *   l: number,          // legendaryCount
 * }
 *
 * CRITICAL: COUNTRIES array order MUST never change — bitset indexes directly into it.
 */

import { COUNTRIES } from '../data/countries'

const PREFIX = 'LC1.'

// ─── Bitset helpers ───────────────────────────────────────────────────────────

/**
 * Build a hex-encoded bitset string from a Set or array of iso2 codes.
 * Bit i = 1 if COUNTRIES[i].iso2 is visited.
 * We pack into Uint8Array (ceil(n/8) bytes).
 */
export function visitedToBitset(visitedObj = {}) {
  const n = COUNTRIES.length
  const bytes = new Uint8Array(Math.ceil(n / 8))
  const keys = new Set(Object.keys(visitedObj).map((k) => k.toUpperCase()))
  COUNTRIES.forEach(({ iso2 }, i) => {
    if (keys.has(iso2)) {
      bytes[Math.floor(i / 8)] |= 1 << (i % 8)
    }
  })
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Decode hex bitset string back into an array of iso2 codes.
 */
export function bitsetToVisited(hexStr = '') {
  const bytes = []
  for (let i = 0; i < hexStr.length; i += 2) {
    bytes.push(parseInt(hexStr.slice(i, i + 2), 16))
  }
  const visited = []
  COUNTRIES.forEach(({ iso2 }, i) => {
    const byte = bytes[Math.floor(i / 8)]
    if (byte !== undefined && (byte >> (i % 8)) & 1) {
      visited.push(iso2)
    }
  })
  return visited
}

// ─── Base64url helpers ────────────────────────────────────────────────────────

function toBase64Url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4
  return atob(pad ? padded + '='.repeat(4 - pad) : padded)
}

// ─── Encode ───────────────────────────────────────────────────────────────────

/**
 * Build a full LC1 share code from passport + visited + finds state.
 * @param {object} passport   — { name, home, no, issuedAt }
 * @param {object} visited    — { "IN": "2026-01-01", ... }
 * @param {object} finds      — { "IN-halwa": "2026-01-01", ... }
 * @param {object} findsData  — SEEDED_FINDS lookup for rarity
 * @returns {string}  e.g. "LC1.eyJ2IjoxLCJuI…"
 */
export function encodePassport(passport, visited = {}, finds = {}, findsData = {}) {
  const name = String(passport?.name || 'TRAVELLER').slice(0, 20)
  const home = String(passport?.home || 'XX').toUpperCase()
  const bitset = visitedToBitset(visited)

  // Count total finds, rare finds, legendary finds
  let totalFinds = 0
  let rareCount = 0
  let legendaryCount = 0

  Object.keys(finds).forEach((findId) => {
    totalFinds++
    // findId = "IN-halwa" → country = "IN", short = "halwa"
    const [country] = findId.split('-')
    const countryFinds = findsData[country.toUpperCase()] || []
    const find = countryFinds.find((f) => f.id === findId)
    if (find?.rarity === 'legendary') legendaryCount++
    else if (find?.rarity === 'rare') rareCount++
  })

  const payload = { v: 1, n: name, h: home, b: bitset, f: totalFinds, r: rareCount, l: legendaryCount }

  try {
    return PREFIX + toBase64Url(JSON.stringify(payload))
  } catch {
    return ''
  }
}

// ─── Decode ───────────────────────────────────────────────────────────────────

/**
 * Decode an LC1 code into a normalised passport descriptor.
 * @returns {object} { version, name, home, visitedList, totalFinds, rareCount, legendaryCount }
 *   or throws an Error with a user-friendly message.
 */
export function decodePassport(code = '') {
  const trimmed = code.trim()
  if (!trimmed.startsWith(PREFIX)) {
    throw new Error('NOT_LC1')
  }

  const b64 = trimmed.slice(PREFIX.length)
  if (!b64) throw new Error('EMPTY_CODE')

  let payload
  try {
    payload = JSON.parse(fromBase64Url(b64))
  } catch {
    throw new Error('CORRUPT_CODE')
  }

  if (!payload || typeof payload !== 'object') throw new Error('CORRUPT_CODE')
  if (payload.v !== 1) throw new Error('UNSUPPORTED_VERSION')
  if (!payload.b || typeof payload.b !== 'string') throw new Error('CORRUPT_CODE')

  const visitedList = bitsetToVisited(payload.b)

  return {
    version: payload.v,
    name: String(payload.n || 'UNKNOWN').slice(0, 20).toUpperCase(),
    home: String(payload.h || 'XX').toUpperCase(),
    visitedList,      // string[]  iso2 codes
    totalFinds: Number(payload.f) || 0,
    rareCount: Number(payload.r) || 0,
    legendaryCount: Number(payload.l) || 0,
  }
}

// ─── Error messages ───────────────────────────────────────────────────────────

export function friendlyDecodeError(errCode) {
  const map = {
    NOT_LC1: 'ENTRY REFUSED — Code must start with valid "LC1." prefix.',
    EMPTY_CODE: 'ENTRY REFUSED — Incomplete passport data stream.',
    CORRUPT_CODE: 'ENTRY REFUSED — Corrupted security checksum. Request fresh code.',
    UNSUPPORTED_VERSION: 'ENTRY REFUSED — Newer passport version detected. Update required.',
  }
  return map[errCode] || 'ENTRY REFUSED — Invalid passport code.'
}

// ─── Sample passports ─────────────────────────────────────────────────────────

/**
 * Three sample personas, each with a pre-baked LC1 code.
 * visitedList: array of iso2 codes.
 */
export const SAMPLE_PASSPORTS = [
  {
    label: 'BACKPACKER',
    subtitle: '60 countries · heavy finds',
    tag: 'DOC-A',
    persona: {
      name: 'ALEX ROADS',
      home: 'US',
      visitedList: [
        'US','CA','MX','GT','BZ','CR','PA','CO','EC','PE','BO','AR','CL','BR','UY',
        'GB','FR','DE','ES','IT','PT','NL','BE','CH','AT','CZ','PL','GR','HR','ME',
        'TR','EG','MA','TN','SN','GH','KE','TZ','ZA','IN','TH','VN','KH','MY','SG',
        'ID','PH','JP','KR','CN','NP','LK','AE','JO','IL','IS','NO','SE','FI','DK',
      ],
      totalFinds: 92,
      rareCount: 18,
      legendaryCount: 4,
    },
  },
  {
    label: 'GULF-HOPPER',
    subtitle: '25 countries · Gulf region heavy',
    tag: 'DOC-B',
    persona: {
      name: 'SARA AL HAMAD',
      home: 'AE',
      visitedList: [
        'AE','SA','QA','KW','BH','OM','JO','LB','EG','TR','MA','TN','IN','PK',
        'LK','MY','SG','TH','MV','ID','GB','FR','DE','IT','ES',
      ],
      totalFinds: 38,
      rareCount: 7,
      legendaryCount: 2,
    },
  },
  {
    label: 'FIRST-TIMER',
    subtitle: '4 countries · just starting',
    tag: 'DOC-C',
    persona: {
      name: 'JAMIE KIM',
      home: 'KR',
      visitedList: ['KR','JP','TH','US'],
      totalFinds: 5,
      rareCount: 1,
      legendaryCount: 0,
    },
  },
]

/**
 * Build a real LC1 code from a sample persona (no finds data needed — we embed counts directly).
 */
export function buildSampleCode(persona) {
  const visited = {}
  persona.visitedList.forEach((iso2) => { visited[iso2] = '2026-01-01' })
  const bitset = visitedToBitset(visited)
  const payload = {
    v: 1,
    n: persona.name.slice(0, 20),
    h: persona.home,
    b: bitset,
    f: persona.totalFinds,
    r: persona.rareCount,
    l: persona.legendaryCount,
  }
  try {
    return PREFIX + toBase64Url(JSON.stringify(payload))
  } catch {
    return ''
  }
}
