import React from 'react'

export default function AtlasPlaceholder({ passport, visitedCount = 1 }) {
  return (
    <div className="flex-1 p-5 flex flex-col justify-between font-typewriter">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-ink/70 border-b border-ink/30 pb-2 mb-4 tracking-widest uppercase">
          <span>SECTION: ATLAS</span>
          <span>PASSPORT: {passport?.no || 'LC-0000'}</span>
        </div>

        <h2 className="font-heading text-3xl font-normal text-ink mb-1">
          Territory Atlas
        </h2>
        <p className="text-xs uppercase tracking-wider text-ink/75 mb-6">
          3D Antique Globe & Sovereign Entry Log
        </p>

        {/* Status Box */}
        <div className="border-2 border-ink p-4 bg-paper-light shadow-sm mb-6">
          <div className="text-[10px] uppercase tracking-widest text-ink/70 mb-1">
            EXPLORATION STATUS
          </div>
          <div className="text-2xl font-bold tracking-widest text-ink">
            {visitedCount} / 195 COUNTRIES
          </div>
          <div className="text-xs text-ink/70 mt-2 uppercase">
            ORIGIN COUNTRY STAMPED: {passport?.home || 'HOME'}
          </div>
        </div>

        {/* Decorative Map / Globe Plate */}
        <div className="border border-dashed border-ink/40 p-6 text-center bg-paper-shadow/30 rounded-sm">
          <div className="w-16 h-16 mx-auto mb-3 border-2 border-ink/40 rounded-full flex items-center justify-center font-heading text-xl text-ink/50">
            ⊕
          </div>
          <p className="text-sm font-bold tracking-wider uppercase text-ink mb-1">
            ATLAS GLOBE UNDER CALIBRATION
          </p>
          <p className="text-xs text-ink/70 leading-relaxed max-w-xs mx-auto">
            Interactive matte 3D globe with search and ticket-stub visa slips will be mounted in next phase.
          </p>
        </div>
      </div>

      {/* Footer watermark */}
      <div className="text-center pt-8 pb-4 text-[10px] text-ink/50 tracking-widest uppercase">
        LAYOVER TRANSIT AUTHORITY // SECTION ATLAS
      </div>
    </div>
  )
}
