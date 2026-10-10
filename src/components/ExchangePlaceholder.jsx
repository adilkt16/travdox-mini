import React, { useState } from 'react'

export default function ExchangePlaceholder({ passport, visitedCount = 1, onResetPassport }) {
  const [copied, setCopied] = useState(false)

  // Quick prototype code
  const sampleCode = `LC1.${btoa(JSON.stringify({ n: passport?.name || 'CITIZEN', h: passport?.home || 'US', v: visitedCount })).replace(/=/g, '')}`

  const handleCopy = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(sampleCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex-1 p-5 flex flex-col justify-between font-typewriter">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between text-[11px] text-ink/70 border-b border-ink/30 pb-2 mb-4 tracking-widest uppercase">
          <span>SECTION: EXCHANGE</span>
          <span>CUSTOMS DESK</span>
        </div>

        <h2 className="font-heading text-3xl font-normal text-ink mb-1">
          Customs Exchange
        </h2>
        <p className="text-xs uppercase tracking-wider text-ink/75 mb-6">
          Passport Code Swap & Travel Twin Compare
        </p>

        {/* Share code block */}
        <div className="border-2 border-ink p-4 bg-paper-light mb-5 shadow-sm">
          <div className="text-[10px] uppercase tracking-widest text-ink/70 mb-1">
            YOUR PASSPORT DISPATCH CODE
          </div>
          <div className="font-typewriter text-sm sm:text-base font-bold tracking-wider text-ink bg-paper-shadow/50 p-2.5 border border-ink/30 break-all select-all">
            {sampleCode}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 w-full py-2 px-3 border-2 border-ink bg-ink text-paper text-xs uppercase tracking-widest font-bold hover:bg-ink-light transition-colors min-h-[44px]"
          >
            {copied ? 'CODE COPIED TO CLIPBOARD ✓' : 'COPY PASSPORT CODE'}
          </button>
        </div>

        {/* Customs Desk Comparison Notice */}
        <div className="border border-dashed border-ink/40 p-4 bg-paper-shadow/30 mb-6 text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-ink mb-1">
            CUSTOMS DESK DISPATCH READY
          </div>
          <p className="text-xs text-ink/70 leading-relaxed">
            Full code generation, friend code inspection, Travel Twins comparison, and sample passport personas will activate in the Exchange module.
          </p>
        </div>

        {/* Development reset option */}
        {onResetPassport && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onResetPassport}
              className="text-xs text-stamp-red border border-stamp-red/50 px-3 py-2 hover:bg-stamp-red/10 uppercase tracking-wider min-h-[44px]"
            >
              Reset & Re-issue Passport
            </button>
          </div>
        )}
      </div>

      {/* Footer watermark */}
      <div className="text-center pt-8 pb-4 text-[10px] text-ink/50 tracking-widest uppercase">
        LAYOVER TRANSIT AUTHORITY // SECTION EXCHANGE
      </div>
    </div>
  )
}
