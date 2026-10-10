import React from 'react'

/**
 * Regal inline SVG crest for the Layover Passport cover and official pages.
 * Features compass rose, laurel branches, shield frame, and stars.
 * Uses gold foil gradient palette (#A57F2C -> #F2DC8A -> #C9A24B).
 */
export default function Crest({ className = 'w-24 h-24' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Layover Passport Crest"
    >
      <defs>
        <linearGradient id="crestGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A57F2C" />
          <stop offset="35%" stopColor="#F2DC8A" />
          <stop offset="70%" stopColor="#C9A24B" />
          <stop offset="100%" stopColor="#8C651F" />
        </linearGradient>
        <filter id="crestEmboss" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.6" floodColor="#000000" floodOpacity="0.8" />
        </filter>
      </defs>

      <g filter="url(#crestEmboss)" stroke="url(#crestGold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer Circular Laurel Guide */}
        <circle cx="60" cy="60" r="54" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />

        {/* Heraldic Shield */}
        <path
          d="M 60 14
             C 74 14, 88 18, 92 28
             C 94 48, 90 74, 60 102
             C 30 74, 26 48, 28 28
             C 32 18, 46 14, 60 14 Z"
          fill="none"
          strokeWidth="2"
        />
        {/* Inner Shield Inset */}
        <path
          d="M 60 20
             C 72 20, 83 23, 86 31
             C 88 47, 84 70, 60 94
             C 36 70, 32 47, 34 31
             C 37 23, 48 20, 60 20 Z"
          fill="none"
          strokeWidth="1"
          opacity="0.8"
        />

        {/* Globe Meridian & Equator Lines Inside Shield */}
        <ellipse cx="60" cy="54" rx="20" ry="20" strokeWidth="1" opacity="0.4" />
        <ellipse cx="60" cy="54" rx="9" ry="20" strokeWidth="1" opacity="0.5" />
        <line x1="40" y1="54" x2="80" y2="54" strokeWidth="1" opacity="0.5" />
        <line x1="44" y1="44" x2="76" y2="44" strokeWidth="0.8" opacity="0.35" />
        <line x1="44" y1="64" x2="76" y2="64" strokeWidth="0.8" opacity="0.35" />

        {/* 8-Point Compass Rose in Center */}
        <path
          d="M 60 38 L 62.5 51.5 L 76 54 L 62.5 56.5 L 60 70 L 57.5 56.5 L 44 54 L 57.5 51.5 Z"
          fill="url(#crestGold)"
          fillOpacity="0.45"
          strokeWidth="1.2"
        />

        {/* Flight Trajectory Arch */}
        <path
          d="M 38 68 Q 60 36 82 46"
          strokeWidth="1.2"
          strokeDasharray="3 2"
          opacity="0.8"
        />
        {/* Stylized Airplane Silhouette */}
        <path
          d="M 83 45 L 87 47 L 85 49 L 81 48 L 79 50 L 78 49 L 79 47.5 L 77 46 L 78 45 L 81 46.5 Z"
          fill="url(#crestGold)"
          strokeWidth="0.5"
        />

        {/* Laurel Wreath Left */}
        <path d="M 24 50 C 22 62, 28 78, 44 88" strokeWidth="1.2" />
        <path d="M 22 52 Q 18 50, 20 46 Q 23 48, 23 52 Z" fill="url(#crestGold)" opacity="0.7" />
        <path d="M 22 60 Q 17 60, 18 56 Q 22 57, 23 60 Z" fill="url(#crestGold)" opacity="0.7" />
        <path d="M 25 70 Q 20 72, 22 67 Q 25 68, 26 70 Z" fill="url(#crestGold)" opacity="0.7" />
        <path d="M 31 79 Q 27 82, 28 77 Q 31 78, 33 79 Z" fill="url(#crestGold)" opacity="0.7" />
        <path d="M 39 86 Q 36 90, 36 85 Q 39 85, 41 86 Z" fill="url(#crestGold)" opacity="0.7" />

        {/* Laurel Wreath Right */}
        <path d="M 96 50 C 98 62, 92 78, 76 88" strokeWidth="1.2" />
        <path d="M 98 52 Q 102 50, 100 46 Q 97 48, 97 52 Z" fill="url(#crestGold)" opacity="0.7" />
        <path d="M 98 60 Q 103 60, 102 56 Q 98 57, 97 60 Z" fill="url(#crestGold)" opacity="0.7" />
        <path d="M 95 70 Q 100 72, 98 67 Q 95 68, 94 70 Z" fill="url(#crestGold)" opacity="0.7" />
        <path d="M 89 79 Q 93 82, 92 77 Q 89 78, 87 79 Z" fill="url(#crestGold)" opacity="0.7" />
        <path d="M 81 86 Q 84 90, 84 85 Q 81 85, 79 86 Z" fill="url(#crestGold)" opacity="0.7" />

        {/* Triad of Stars Above Shield */}
        {/* Center Star */}
        <polygon
          points="60,3 61.5,7.5 66,7.5 62.5,10 64,14.5 60,11.5 56,14.5 57.5,10 54,7.5 58.5,7.5"
          fill="url(#crestGold)"
          strokeWidth="0.5"
        />
        {/* Left Star */}
        <polygon
          points="46,7 47,10 50,10 47.5,12 48.5,15 46,13 43.5,15 44.5,12 42,10 45,10"
          fill="url(#crestGold)"
          strokeWidth="0.5"
        />
        {/* Right Star */}
        <polygon
          points="74,7 75,10 78,10 75.5,12 76.5,15 74,13 71.5,15 72.5,12 70,10 73,10"
          fill="url(#crestGold)"
          strokeWidth="0.5"
        />
      </g>
    </svg>
  )
}
