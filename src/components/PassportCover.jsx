import React, { useState } from 'react'
import Crest from './Crest'

/**
 * Closed passport cover screen.
 * - Oxblood (#5A1F26) leatherette texture in CSS
 * - Gold foil embossed "LAYOVER" title (gradient: #A57F2C -> #F2DC8A -> #C9A24B)
 * - Small crest as inline SVG
 * - Tap/click to open with a CSS 3D page-flip animation (~500ms)
 */
export default function PassportCover({ onOpen }) {
  const [isFlipping, setIsFlipping] = useState(false)

  const handleOpen = () => {
    if (isFlipping) return
    setIsFlipping(true)

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const duration = prefersReducedMotion ? 50 : 500
    setTimeout(() => {
      onOpen()
    }, duration)
  }

  return (
    <div className="passport-perspective-container w-full min-h-[100dvh] flex items-center justify-center p-4">
      {/* 3D Flipping Card Container */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Closed Layover Passport. Tap to open and issue your passport."
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleOpen()
          }
        }}
        className={`passport-flip-cover cursor-pointer select-none relative w-full max-w-[380px] aspect-[1/1.42] rounded-r-2xl rounded-l-sm leatherette flex flex-col items-center justify-between p-7 sm:p-9 shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold-light ${
          isFlipping ? 'passport-flipped pointer-events-none' : 'hover:-translate-y-1 hover:shadow-[0_25px_50px_-12px_rgba(20,10,12,0.8)]'
        }`}
      >
        {/* Spine Crease / Stitched Left Edge */}
        <div
          className="absolute left-0 top-0 bottom-0 w-5 pointer-events-none rounded-l-sm"
          style={{
            background:
              'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 60%, rgba(255,255,255,0.06) 85%, transparent 100%)',
            borderRight: '1px dashed rgba(242, 220, 138, 0.25)',
          }}
          aria-hidden="true"
        />

        {/* Gold Foil Ornate Inset Border */}
        <div
          className="absolute inset-3.5 sm:inset-4 border border-[#C9A24B]/40 rounded-r-xl rounded-l-none pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(165, 127, 44, 0.25), 0 0 0 1px rgba(0,0,0,0.3)',
          }}
          aria-hidden="true"
        >
          {/* Corner Ornament Accents */}
          <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-gold-light/60" />
          <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-gold-light/60" />
          <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-gold-light/60" />
          <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-gold-light/60" />
        </div>

        {/* Top Header: Sovereign Title */}
        <div className="text-center mt-2 z-10">
          <p className="font-typewriter text-[10px] sm:text-xs tracking-[0.25em] text-[#C9A24B]/80 uppercase mb-2">
            GLOBAL TRAVEL DOCUMENT
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl font-normal tracking-[0.18em] uppercase gold-foil-text drop-shadow-md">
            LAYOVER
          </h1>
          <div className="w-16 h-[1.5px] mx-auto mt-2 bg-gradient-to-r from-transparent via-[#F2DC8A] to-transparent opacity-70" />
        </div>

        {/* Center: Regal Crest */}
        <div className="my-auto py-2 z-10 flex flex-col items-center">
          <Crest className="w-28 h-28 sm:w-32 sm:h-32 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
        </div>

        {/* Bottom: Passport Designation and Tap Cue */}
        <div className="text-center mb-1 z-10 w-full">
          <p className="font-heading text-xl sm:text-2xl tracking-[0.28em] uppercase gold-foil-text mb-4">
            PASSPORT
          </p>

          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded border border-[#C9A24B]/35 bg-[#3F1419]/70 text-[#F2DC8A] font-typewriter text-xs tracking-widest uppercase transition-colors hover:bg-[#5A1F26] hover:border-[#F2DC8A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F2DC8A] animate-pulse" />
            <span>TAP TO OPEN</span>
          </div>
        </div>
      </div>
    </div>
  )
}
