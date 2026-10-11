import React from 'react'
import { Link } from 'react-router-dom'
import { getStampColor } from '../lib/geo'
import HoldToStamp from './HoldToStamp'

/**
 * Torn Ticket-Stub Bottom Slip
 * Must look like a physical torn transit ticket stub, not an app modal card:
 * - Jagged torn perforated teeth along top edge
 * - Circular ticket punch bite notches on left & right
 * - Perforated fold/tear dashed line with tear prompt
 * - Vintage railway / transit pass typography & serial numbering
 * - Barcode lines and stamp validation box
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
      className="absolute bottom-3 left-2.5 right-2.5 sm:left-3 sm:right-3 z-30 transition-all duration-300 ease-out"
      role="dialog"
      aria-labelledby="ticket-country-name"
    >
      {/* Outer Torn Ticket Stub Wrapper */}
      <div className="relative filter drop-shadow-[0_12px_24px_rgba(28,43,75,0.45)]">
        {/* Jagged Torn Paper Top Edge */}
        <div className="w-full overflow-hidden leading-none select-none pointer-events-none -mb-[1px]">
          <svg
            viewBox="0 0 400 10"
            preserveAspectRatio="none"
            className="w-full h-2.5 block text-[#FBF7ED] fill-current stroke-ink stroke-[1.2]"
          >
            <path d="M 0,10 L 0,3 L 8,0 L 16,4 L 24,1 L 32,5 L 40,0 L 48,4 L 56,1 L 64,5 L 72,0 L 80,4 L 88,1 L 96,5 L 104,0 L 112,4 L 120,1 L 128,5 L 136,0 L 144,4 L 152,1 L 160,5 L 168,0 L 176,4 L 184,1 L 192,5 L 200,0 L 208,4 L 216,1 L 224,5 L 232,0 L 240,4 L 248,1 L 256,5 L 264,0 L 272,4 L 280,1 L 288,5 L 296,0 L 304,4 L 312,1 L 320,5 L 328,0 L 336,4 L 344,1 L 352,5 L 360,0 L 368,4 L 376,1 L 384,5 L 392,0 L 400,4 L 400,10 Z" />
          </svg>
        </div>

        {/* Main Ticket Stub Body */}
        <div className="relative bg-[#FBF7ED] text-ink border-x-2 border-b-2 border-ink rounded-b-sm overflow-visible">
          {/* Circular Ticket Punch Bite Notches on Left and Right along perforation line */}
          <div
            className="absolute -left-[9px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#E4D7B8] border-2 border-ink z-20 pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -right-[9px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#E4D7B8] border-2 border-ink z-20 pointer-events-none"
            aria-hidden="true"
          />

          <div className="px-4 pt-2.5 pb-3 sm:px-5 sm:pb-3.5">
            {/* Ticket Perforation Holes Row at Top */}
            <div className="flex items-center justify-between border-b border-dashed border-ink/35 pb-2 mb-2 font-typewriter text-[9px] sm:text-[10px] uppercase tracking-wider text-ink/75">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-stamp-red inline-block" />
                <span className="font-bold text-ink">LAYOVER TRANSIT · PASSENGER STUB</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-ink/65 tracking-widest">{serialNo}</span>
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

            {/* Main Country Information & Status */}
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <h3
                    id="ticket-country-name"
                    className="font-heading text-2xl sm:text-3xl font-bold text-ink leading-tight truncate"
                  >
                    {country.name}
                  </h3>
                  <span className="font-typewriter text-[11px] px-1.5 py-0.5 border border-ink/40 bg-paper-shadow/30 rounded-xs shrink-0 font-bold">
                    {country.iso2}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 font-typewriter text-[9px] text-ink/65 uppercase tracking-wider">
                  <span>COORDINATES: {country.lat.toFixed(2)}°N, {country.lng.toFixed(2)}°E</span>
                </div>
              </div>

              {/* Status Stamp Box */}
              <div
                className={`px-2.5 py-1 text-center border-2 border-dashed rounded-xs shrink-0 font-typewriter text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
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
                    <div className="text-[8px] font-normal tracking-normal opacity-85 mt-0.5">
                      {visitedDate || 'RECORDED'}
                    </div>
                  </div>
                ) : (
                  <div className="leading-none">NOT YET ENTERED</div>
                )}
              </div>
            </div>

            {/* Perforated Fold Line with Vintage Center Prompt */}
            <div className="relative border-t-2 border-dashed border-ink/35 my-2.5">
              <span className="absolute left-1/2 -top-2 -translate-x-1/2 bg-[#FBF7ED] px-2 font-typewriter text-[8px] text-ink/50 tracking-widest uppercase">
                FOLD & TEAR HERE FOR ENTRY
              </span>
            </div>

            {/* Ticket Actions & Barcode */}
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
                  buttonClassName="w-full bg-[#E7DBBE] hover:bg-paper-light border-2 border-ink text-ink font-bold tracking-widest"
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

            {/* Ticket Stub Barcode Footer */}
            <div className="mt-2.5 pt-1.5 border-t border-ink/15 flex items-center justify-between text-[8px] font-mono text-ink/50 uppercase">
              <div className="flex items-center gap-[2px] h-3.5">
                {[2, 1, 3, 1, 1, 4, 2, 1, 3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1, 2].map((w, i) => (
                  <span
                    key={i}
                    className="bg-ink inline-block h-full"
                    style={{ width: `${w}px`, opacity: i % 2 === 0 ? 0.6 : 0.8 }}
                  />
                ))}
              </div>
              <span className="tracking-widest">VALID FOR GLOBAL TRANSIT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
