import React, { useMemo } from 'react'
import { usePassport, useVisited, useFinds, useCustomFinds } from '../lib/store'
import { COUNTRIES_BY_ISO2, getStampColor } from '../lib/geo'
import { getFindsForCountry } from '../data/finds'
import Stamp, { hashString, formatStampDate } from './Stamp'

/* ─── helpers ──────────────────────────────────────────────────────────── */

/** seeded float 0..1 from a string */
function seededFloat(str) {
  const h = hashString(str)
  return (h % 10000) / 10000
}

/** MRZ line padded to exactly len chars with < */
function mrzPad(str, len) {
  const s = String(str || '').toUpperCase().replace(/[^A-Z0-9]/g, '<')
  return (s + '<'.repeat(len)).slice(0, len)
}

/** Build the two classic MRZ lines */
function buildMRZ(passport) {
  const name = (passport?.name || 'CITIZEN').toUpperCase().replace(/\s+/g, '<<')
  const no   = (passport?.no   || 'LC0000').replace(/-/g, '').toUpperCase()
  const home = (passport?.home || 'XX').toUpperCase()
  const line1 = 'P<' + mrzPad(home, 3) + mrzPad(name, 39)
  const line2 = mrzPad(no, 9) + home + '9901014M3510114' + mrzPad('', 14) + '06'
  return [line1.slice(0, 44), line2.slice(0, 44)]
}

/** Tally rare + legendary from finds map */
function rarityStats(finds, allFindsIndex) {
  let rare = 0, legendary = 0
  if (!finds || !allFindsIndex) return { rare, legendary }
  for (const id of Object.keys(finds)) {
    const fd = allFindsIndex[id]
    if (!fd) continue
    if (fd.rarity === 'rare') rare++
    if (fd.rarity === 'legendary') legendary++
  }
  return { rare, legendary }
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

function DataField({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '8px', color: 'rgba(28,43,75,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '11px', color: '#1C2B4B', fontWeight: 700, letterSpacing: '0.05em', marginTop: '1px' }}>
        {value}
      </div>
    </div>
  )
}

function PageFooter({ pageNum, totalPages }) {
  return (
    <div
      className="text-center py-1.5 border-t border-ink/20 shrink-0"
      style={{ fontFamily: "'Special Elite', monospace", fontSize: '10px', color: 'rgba(28,43,75,0.5)', letterSpacing: '0.2em', position: 'relative', zIndex: 10 }}
    >
      PAGE {pageNum} / {totalPages}
    </div>
  )
}

/* Security dot overlay */
function SecurityDots() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(28,43,75,0.03) 1px, transparent 1px)',
        backgroundSize: '8px 8px',
        zIndex: 0,
      }}
    />
  )
}

/* ─── Holder page (page 1) ─────────────────────────────────────────────── */
function HolderPage({ passport, visitedCount, totalFinds, rareCount, legendaryCount, pageNum, totalPages }) {
  const [mrzLine1, mrzLine2] = buildMRZ(passport)
  const issueDate = formatStampDate(passport?.issuedAt)
  const homeCode  = (passport?.home || 'XX').toUpperCase()
  const initial   = (passport?.name || 'C').charAt(0).toUpperCase()

  return (
    <div
      style={{
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        minWidth: '100%',
        width: '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: '#F1E8D2',
      }}
    >
      <SecurityDots />

      {/* Guilloche top banner */}
      <div
        className="h-8 shrink-0 flex items-center justify-center"
        style={{
          background: '#5A1F26',
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 8px)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '8px', color: '#F2DC8A', letterSpacing: '0.3em' }}>
          LAYOVER TRANSIT AUTHORITY — OFFICIAL TRAVEL DOCUMENT
        </span>
      </div>

      <div className="flex flex-col flex-1 px-5 pt-4 pb-2 gap-3 overflow-hidden" style={{ position: 'relative', zIndex: 2 }}>

        {/* Title row */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl text-ink leading-tight" style={{ fontFamily: "'IM Fell English', Georgia, serif", margin: 0 }}>
              PASSPORT
            </h1>
            <p className="text-ink/60 mt-0.5" style={{ fontFamily: "'Special Elite', monospace", fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0 }}>
              LAYOVER TRANSIT AUTHORITY
            </p>
          </div>
          <svg width="44" height="44" viewBox="0 0 48 48" style={{ opacity: 0.28, flexShrink: 0 }}>
            <circle cx="24" cy="24" r="21" fill="none" stroke="#1C2B4B" strokeWidth="1.5" />
            <circle cx="24" cy="24" r="16" fill="none" stroke="#1C2B4B" strokeWidth="0.8" strokeDasharray="3 2" />
            <text x="24" y="29" textAnchor="middle" fontFamily="'Big Shoulders Display'" fontSize="13" fontWeight="900" fill="#1C2B4B">LTA</text>
          </svg>
        </div>

        {/* Photo + data grid */}
        <div style={{ display: 'flex', gap: '12px', border: '1px solid rgba(28,43,75,0.3)', background: '#F7F1E1', padding: '10px' }}>
          {/* photo placeholder */}
          <div style={{ width: '72px', flexShrink: 0, minHeight: '88px', background: 'rgba(28,43,75,0.06)', border: '1px solid rgba(28,43,75,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(28,43,75,0.1)', border: '1px solid rgba(28,43,75,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Big Shoulders Display'", fontSize: '20px', fontWeight: 900, color: 'rgba(28,43,75,0.3)' }}>{initial}</span>
            </div>
            <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '7px', color: 'rgba(28,43,75,0.4)', letterSpacing: '0.1em' }}>PHOTO</span>
          </div>

          {/* data grid */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
            <DataField label="SURNAME / GIVEN NAMES" value={(passport?.name || 'CITIZEN').toUpperCase()} />
            <DataField label="NATIONALITY" value={homeCode} />
            <DataField label="PASSPORT NO." value={passport?.no || 'LC-0000'} />
            <DataField label="DATE OF ISSUE" value={issueDate} />
            <DataField label="PLACE OF ISSUE" value="LAYOVER INTL." />
            <DataField label="AUTHORITY" value="L.T.A." />
          </div>
        </div>

        {/* Totals bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1px solid rgba(28,43,75,0.25)' }}>
          {[
            { label: 'COUNTRIES', value: visitedCount },
            { label: 'FINDS',     value: totalFinds },
            { label: 'RARE',      value: rareCount },
            { label: 'LEGENDARY', value: legendaryCount },
          ].map(({ label, value }, i) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 2px', borderLeft: i > 0 ? '1px solid rgba(28,43,75,0.2)' : 'none', background: 'rgba(228,215,184,0.3)' }}>
              <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '20px', fontWeight: 700, color: '#1C2B4B', lineHeight: 1 }}>{value}</span>
              <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '7px', letterSpacing: '0.15em', color: 'rgba(28,43,75,0.55)', textTransform: 'uppercase', marginTop: '3px' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* MRZ */}
        <div style={{ borderTop: '2px solid rgba(28,43,75,0.3)', paddingTop: '8px', marginTop: 'auto' }}>
          <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '8px', color: 'rgba(28,43,75,0.45)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
            MACHINE READABLE ZONE
          </div>
          <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '9px', letterSpacing: '0.12em', lineHeight: '1.8', color: 'rgba(28,43,75,0.7)', wordBreak: 'break-all', background: 'rgba(228,215,184,0.5)', border: '1px solid rgba(28,43,75,0.12)', padding: '6px 10px', overflowX: 'hidden' }}>
            <div>{mrzLine1}</div>
            <div>{mrzLine2}</div>
          </div>
          {/* Credits Line in Special Elite */}
          <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '8.5px', color: 'rgba(28,43,75,0.45)', letterSpacing: '0.14em', textAlign: 'center', marginTop: '6px', textTransform: 'uppercase' }}>
            Built overnight at LAYOVER 2026
          </div>
        </div>
      </div>

      <PageFooter pageNum={pageNum} totalPages={totalPages} />
    </div>
  )
}

/* ─── Country page ─────────────────────────────────────────────────────── */
function CountryPassportPage({ iso2, date, collectedFinds, allFindsForCountry, pageNum, totalPages }) {
  const country = COUNTRIES_BY_ISO2.get(iso2) || { iso2, name: iso2 }
  const stampColor = getStampColor(iso2)
  const formattedDate = formatStampDate(date)

  const placedStamps = useMemo(() => {
    const collected = allFindsForCountry.filter(f => collectedFinds[f.id])
    return collected.map((f) => {
      const x = 5 + seededFloat(f.id + '-x') * 52
      const y = 20 + seededFloat(f.id + '-y') * 50
      const extraTilt = (seededFloat(f.id + '-t') - 0.5) * 8
      return { find: f, x, y, extraTilt, collectedDate: collectedFinds[f.id] }
    })
  }, [allFindsForCountry, collectedFinds])

  const collectedCount = Object.keys(collectedFinds).length

  return (
    <div
      style={{
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        minWidth: '100%',
        width: '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: '#F1E8D2',
      }}
    >
      <SecurityDots />

      {/* Country header strip */}
      <div
        style={{ padding: '10px 16px 8px', borderBottom: '1px solid rgba(28,43,75,0.2)', background: `${stampColor}14`, position: 'relative', zIndex: 2, flexShrink: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '18px', color: '#1C2B4B', fontWeight: 700, lineHeight: 1 }}>
            {country.name.toUpperCase()}
          </span>
          <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '9px', color: 'rgba(28,43,75,0.6)', letterSpacing: '0.1em', flexShrink: 0 }}>
            ENTRY · {formattedDate}
          </span>
        </div>
        <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '8px', color: 'rgba(28,43,75,0.45)', marginTop: '2px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {iso2} · {collectedCount} FINDS COLLECTED
        </div>
      </div>

      {/* Entry stamp — upper right area */}
      <div style={{ position: 'absolute', top: '52px', right: '10px', zIndex: 20, pointerEvents: 'none' }}>
        <Stamp
          id={'entry-' + iso2}
          title={country.name}
          subtitle="ENTRY"
          date={date}
          rarity="common"
          color={stampColor}
          size={96}
          showOverstamp={false}
        />
      </div>

      {/* Ruled paper area for stamps */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(28,43,75,0.07) 28px)',
          backgroundSize: '100% 28px',
          minHeight: 0,
          zIndex: 2,
        }}
      >
        {placedStamps.map(({ find, x, y, extraTilt, collectedDate }) => (
          <div
            key={find.id}
            style={{
              position: 'absolute',
              left: x + '%',
              top: y + '%',
              transform: 'rotate(' + extraTilt + 'deg)',
              zIndex: 10 + (hashString(find.id) % 8),
              pointerEvents: 'none',
            }}
          >
            <Stamp
              id={find.id}
              title={find.title}
              subtitle={find.category || 'FIND'}
              date={collectedDate}
              rarity={find.rarity || 'common'}
              size={78}
              showOverstamp={find.rarity === 'rare' || find.rarity === 'legendary'}
              style={{ opacity: 0.88 }}
            />
          </div>
        ))}

        {placedStamps.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Special Elite', monospace", fontSize: '11px', color: 'rgba(28,43,75,0.25)', textAlign: 'center', letterSpacing: '0.12em', lineHeight: 1.8 }}>
              ENTRY RECORDED.<br />NO FINDS COLLECTED YET.
            </span>
          </div>
        )}
      </div>

      <PageFooter pageNum={pageNum} totalPages={totalPages} />
    </div>
  )
}

/* ─── Empty state page ─────────────────────────────────────────────────── */
function EmptyPage({ pageNum, totalPages }) {
  return (
    <div
      style={{
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        minWidth: '100%',
        width: '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: '#F1E8D2',
      }}
    >
      <SecurityDots />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(28,43,75,0.07) 28px)',
          backgroundSize: '100% 28px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '24px', color: 'rgba(28,43,75,0.38)', textAlign: 'center', lineHeight: 1.3, letterSpacing: '0.04em' }}>
          NOTHING TO DECLARE
        </div>
        <div style={{ marginTop: '16px', width: '80px', borderTop: '1px solid rgba(28,43,75,0.18)' }} />
        <div style={{ marginTop: '12px', fontFamily: "'Special Elite', monospace", fontSize: '9px', color: 'rgba(28,43,75,0.32)', letterSpacing: '0.18em', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.8 }}>
          No visitation records stamped.<br />Explore the Atlas to fill this passport.
        </div>
      </div>

      <PageFooter pageNum={pageNum} totalPages={totalPages} />
    </div>
  )
}

/* ─── Main PassportTab ───────────────────────────────────────────────────  */
export default function PassportTab() {
  const [passport]    = usePassport()
  const [visited]     = useVisited()
  const [finds]       = useFinds()
  const [customFinds] = useCustomFinds()

  // Build index of all finds keyed by id
  const allFindsIndex = useMemo(() => {
    const index = {}
    const visitedIsos = visited ? Object.keys(visited) : []
    for (const iso2 of visitedIsos) {
      for (const f of getFindsForCountry(iso2)) index[f.id] = f
      for (const f of ((customFinds && customFinds[iso2]) || [])) index[f.id] = f
    }
    return index
  }, [visited, customFinds])

  // Sorted visited: most recent first
  const sortedVisited = useMemo(() => {
    if (!visited) return []
    return Object.entries(visited).sort(([, a], [, b]) => (b > a ? 1 : b < a ? -1 : 0))
  }, [visited])

  const visitedCount = sortedVisited.length
  const totalFinds   = finds ? Object.keys(finds).length : 0
  const { rare: rareCount, legendary: legendaryCount } = rarityStats(finds, allFindsIndex)

  const countryPageCount = Math.max(sortedVisited.length, 1)
  const totalPages = 1 + countryPageCount

  if (!passport) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Special Elite', monospace", color: 'rgba(28,43,75,0.4)', fontSize: '13px', letterSpacing: '0.12em', lineHeight: 1.6 }}>
          ISSUE A PASSPORT FIRST.
        </p>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      {/* scroll-snap horizontal container */}
      <div
        id="passport-scroll"
        style={{
          flex: 1,
          display: 'flex',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          minHeight: 0,
        }}
      >
        {/* Page 1: Holder */}
        <HolderPage
          passport={passport}
          visitedCount={visitedCount}
          totalFinds={totalFinds}
          rareCount={rareCount}
          legendaryCount={legendaryCount}
          pageNum={1}
          totalPages={totalPages}
        />

        {/* Pages 2+: country pages or empty */}
        {sortedVisited.length === 0 ? (
          <EmptyPage pageNum={2} totalPages={totalPages} />
        ) : (
          sortedVisited.map(([iso2, date], idx) => {
            const allFindsForCountry = [
              ...getFindsForCountry(iso2),
              ...((customFinds && customFinds[iso2]) || []),
            ]
            const collectedFinds = {}
            if (finds) {
              for (const f of allFindsForCountry) {
                if (finds[f.id]) collectedFinds[f.id] = finds[f.id]
              }
            }
            return (
              <CountryPassportPage
                key={iso2}
                iso2={iso2}
                date={date}
                collectedFinds={collectedFinds}
                allFindsForCountry={allFindsForCountry}
                pageNum={2 + idx}
                totalPages={totalPages}
              />
            )
          })
        )}
      </div>

      {/* swipe hint */}
      <div style={{ textAlign: 'center', padding: '4px', fontFamily: "'Special Elite', monospace", fontSize: '9px', color: 'rgba(28,43,75,0.32)', letterSpacing: '0.2em', flexShrink: 0 }}>
        ← SWIPE TO TURN PAGES →
      </div>
    </div>
  )
}
