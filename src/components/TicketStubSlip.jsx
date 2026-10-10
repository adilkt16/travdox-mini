import React from 'react'
import { Link } from 'react-router-dom'
import { getStampColor } from '../lib/geo'
import HoldToStamp from './HoldToStamp'

/**
 * Torn Ticket-Stub Bottom Slip
 * Displays country information, visit status, "Mark as entered", and link to country page.
 */
export default function TicketStubSlip({
  country,
  isVisited,
  visitedDate,
  onMarkVisited,
  onClose,
}) {
  if (!country) return null

  const stampColor = getStampColor(country.iso2)
  const serialNo = `TKT-${country.iso2}-${Math.abs(
    (country.lat * 100 + country.lng * 10) | 0
  )
    .toString()
    .padStart(4, '0')
    .slice(-4)}`

  return (
    <div
      className="absolute bottom-3 left-3 right-3 z-30 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4"
      role="dialog"
      aria-labelledby="ticket-country-name"
    >
      {/* Outer Stub Container */}
      <div className="relative bg-[#FBF7ED] text-ink border-2 border-ink shadow-2xl rounded-sm overflow-hidden">
        {/* Torn top edge simulation (perforated jagged teeth) */}
        <div
          className="h-3 w-full bg-cover/85 border-b border-ink/40 relative overflow-hidden"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #1C2B4B 0, #1C2B4B 3px, transparent 3px, transparent 6px)',
            opacity: 0.25,
          }}
        />

        {/* Circular Ticket Punch Notches on Left and Right */}
        <div
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#E4D7B8] border-2 border-ink z-10"
          aria-hidden="true"
        />
        <div
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#E4D7B8] border-2 border-ink z-10"
          aria-hidden="true"
        />

        <div className="px-5 py-3.5">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-ink/25 pb-2 mb-2.5 font-typewriter text-[10px] uppercase tracking-wider text-ink/75">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ink inline-block" />
              <span className="font-bold text-ink">TRANSIT AUTHORITY ENTRY PASS</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline font-mono">{serialNo}</span>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center font-typewriter text-xs text-ink/70 hover:text-ink hover:font-bold -my-2 -mr-2 transition-colors cursor-pointer"
                aria-label="Close ticket slip"
                id="btn-close-slip"
              >
                [✕]
              </button>
            </div>
          </div>

          {/* Main Country Information */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-baseline gap-2">
                <h3
                  id="ticket-country-name"
                  className="font-heading text-2xl font-bold text-ink leading-tight"
                >
                  {country.name}
                </h3>
                <span className="font-typewriter text-xs px-1.5 py-0.5 border border-ink/40 bg-paper-shadow/30 rounded-xs">
                  {country.iso2}
                </span>
              </div>
              <p className="font-typewriter text-[10px] text-ink/70 mt-0.5 tracking-wider uppercase">
                COORDINATES: {country.lat.toFixed(2)}°N, {country.lng.toFixed(2)}°E
              </p>
            </div>

            {/* Status Stamp Box */}
            <div
              className={`px-2.5 py-1 text-center border-2 border-dashed rounded-xs shrink-0 font-typewriter text-[11px] font-bold uppercase tracking-widest ${
                isVisited
                  ? 'border-stamp-blue bg-stamp-blue/10 text-stamp-blue'
                  : 'border-ink/40 bg-paper-shadow/20 text-ink/70'
              }`}
              style={
                isVisited
                  ? { borderColor: stampColor, color: stampColor }
                  : undefined
              }
            >
              {isVisited ? (
                <div>
                  <div className="leading-none">★ ENTERED</div>
                  <div className="text-[9px] font-normal tracking-normal opacity-85 mt-0.5">
                    {visitedDate || 'RECORDED'}
                  </div>
                </div>
              ) : (
                <div className="leading-none">NOT YET VISITED</div>
              )}
            </div>
          </div>

          {/* Perforated Fold Line */}
          <div className="relative border-t-2 border-dashed border-ink/35 my-2.5">
            <span className="absolute left-1/2 -top-2 -translate-x-1/2 bg-[#FBF7ED] px-2 font-typewriter text-[8px] text-ink/50 tracking-widest uppercase">
              FOLD & TEAR HERE
            </span>
          </div>

          {/* Ticket Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 font-typewriter">
            {!isVisited ? (
              <HoldToStamp
                id={`entry-${country.iso2}`}
                title={country.name}
                subtitle="ENTRY VISA"
                color={stampColor}
                onStamp={() => onMarkVisited(country.iso2)}
                label="HOLD TO STAMP ENTRY"
                className="flex-1"
                buttonClassName="w-full bg-[#E7DBBE] hover:bg-paper-light border-2 border-ink text-ink font-bold"
              />
            ) : (
              <div className="flex-1 min-h-[44px] px-3 py-2 border-2 border-ink/40 bg-paper-shadow/30 text-ink/80 text-xs uppercase tracking-wider flex items-center justify-center gap-2 font-semibold">
                <span style={{ color: stampColor }}>✓</span>
                <span>Entry Stamped ({visitedDate || 'RECORDED'})</span>
              </div>
            )}

            <Link
              to={`/country/${country.iso2.toLowerCase()}`}
              id="btn-open-country-page"
              className="min-h-[44px] px-4 py-2 border-2 border-ink bg-paper-light hover:bg-paper active:scale-[0.98] text-ink font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm text-center shrink-0"
            >
              <span>Open page</span>
              <span className="text-sm">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
