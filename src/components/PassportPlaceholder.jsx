import React from 'react'

export default function PassportPlaceholder({ passport, visitedCount = 1, findsCount = 0 }) {
  return (
    <div className="flex-1 p-5 flex flex-col justify-between font-typewriter">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between text-[11px] text-ink/70 border-b border-ink/30 pb-2 mb-4 tracking-widest uppercase">
          <span>SECTION: PASSPORT</span>
          <span>PAGE 01 / 12</span>
        </div>

        <h2 className="font-heading text-3xl font-normal text-ink mb-1">
          Bearer Folio
        </h2>
        <p className="text-xs uppercase tracking-wider text-ink/75 mb-6">
          Official Visa Folio & Endorsements
        </p>

        {/* Holder identification card */}
        <div className="border-2 border-ink p-4 bg-paper-light mb-6 shadow-sm relative">
          <div className="text-[10px] uppercase tracking-widest text-ink/70 border-b border-ink/20 pb-1 mb-3">
            HOLDER PARTICULARS
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs uppercase">
            <div>
              <span className="block text-[10px] text-ink/60">SURNAME / GIVEN NAME</span>
              <span className="font-bold text-sm tracking-wide text-ink">
                {passport?.name || 'CITIZEN'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-ink/60">PASSPORT NO.</span>
              <span className="font-bold text-sm tracking-wide text-ink">
                {passport?.no || 'LC-0000'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-ink/60">NATIONALITY / ORIGIN</span>
              <span className="font-bold text-sm tracking-wide text-ink">
                {passport?.home || 'XX'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-ink/60">DATE OF ISSUE</span>
              <span className="font-bold text-sm tracking-wide text-ink">
                {passport?.issuedAt || '2026-10-11'}
              </span>
            </div>
          </div>

          {/* Decorative MRZ Zone */}
          <div className="mt-4 pt-3 border-t border-ink/20 font-mono text-[11px] tracking-widest text-ink/80 leading-relaxed select-all">
            P&lt;UTO{passport?.name ? passport.name.replace(/\s+/g, '&lt;') : 'CITIZEN'}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
            <br />
            {passport?.no || 'LC4821'}9UTO9901014M3510114&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;06
          </div>
        </div>

        {/* Visited Country Status */}
        <div className="border border-dashed border-ink/40 p-4 bg-paper-shadow/20 mb-4">
          <div className="text-[11px] uppercase tracking-wider text-ink/70 mb-1">
            RECORDED ENTRY STAMPS
          </div>
          <div className="text-xs text-ink/90">
            {visitedCount} COUNTRY VISITED • {findsCount} FINDS CATALOGUED
          </div>
        </div>

        {/* Empty state note */}
        <div className="p-4 border border-ink/30 bg-paper text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/80">
            NO ADDITIONAL ENTRIES YET. GO FILL ME.
          </p>
        </div>
      </div>

      {/* Footer watermark */}
      <div className="text-center pt-8 pb-4 text-[10px] text-ink/50 tracking-widest uppercase">
        LAYOVER TRANSIT AUTHORITY // SECTION PASSPORT
      </div>
    </div>
  )
}
