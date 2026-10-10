import React from 'react'

/**
 * Deterministic hash function for stable values across renders
 */
export function hashString(str = '') {
  let hash = 0
  const s = String(str)
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Format ISO date string into classic passport stamp date: e.g. "11 OCT 2026"
 */
export function formatStampDate(dateString) {
  if (!dateString) {
    const now = new Date()
    return `${String(now.getDate()).padStart(2, '0')} ${[
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ][now.getMonth()]} ${now.getFullYear()}`
  }

  // Handle YYYY-MM-DD
  const parts = dateString.split('-')
  if (parts.length === 3) {
    const year = parts[0]
    const monthIdx = parseInt(parts[1], 10) - 1
    const day = parts[2]
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return `${day} ${months[monthIdx] || 'OCT'} ${year}`
  }
  return String(dateString).toUpperCase()
}

/**
 * <Stamp> SVG component
 * - Shape (circle/oval/rectangle/hexagon) chosen by hash of id — stable across renders
 * - Text on a curve in Big Shoulders Display caps + date below
 * - Ink color by rarity: common=blue #2A4B9B, rare=red #B23A2B, legendary=gold foil gradient with slow shimmer
 * - Rough ink edges: feTurbulence + feDisplacementMap SVG filters
 * - mix-blend-mode: multiply
 * - Tilt: slight random angle seeded by id, same every render
 * - Overstamp banner: Rare -> "RARE FIND", Legendary -> "LEGENDARY"
 */
export default function Stamp({
  id = 'stamp-default',
  title = 'IMMIGRATION',
  subtitle = 'ENTRY VISA',
  date,
  rarity = 'common',
  color, // optional color override (e.g. for country entry stamp)
  size = 140, // width & height in px
  className = '',
  style = {},
  showOverstamp = true,
}) {
  const hash = hashString(id)
  const safeId = `stamp-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}-${hash % 1000}`

  // Shape choice: 0=circle, 1=oval, 2=rectangle, 3=hexagon
  const shapes = ['circle', 'oval', 'rectangle', 'hexagon']
  const shape = shapes[hash % 4]

  // Tilt angle seeded by id: between -4.5deg and +4.5deg
  const tilt = ((((hash % 180) - 90) / 20)).toFixed(1)

  // Ink color
  const isLegendary = rarity === 'legendary'
  const isRare = rarity === 'rare'
  
  let inkColor = color
  if (!inkColor) {
    if (isLegendary) inkColor = `url(#gold-grad-${safeId})`
    else if (isRare) inkColor = '#B23A2B'
    else inkColor = '#2A4B9B' // common
  }

  const formattedDate = formatStampDate(date)
  const displayTitle = (title || 'PASSPORT CONTROL').toUpperCase().slice(0, 24)
  const displaySub = (subtitle || 'INSPECTION').toUpperCase().slice(0, 18)

  return (
    <div
      className={`inline-block select-none relative transition-transform ${
        isLegendary ? 'animate-shimmer-slow' : ''
      } ${className}`}
      style={{
        mixBlendMode: 'multiply',
        transform: `rotate(${tilt}deg)`,
        transformOrigin: 'center center',
        width: size,
        height: size,
        ...style,
      }}
      aria-label={`${title} stamp, ${rarity} rarity`}
    >
      <svg
        viewBox="0 0 160 160"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <defs>
          {/* Rough ink filter using feTurbulence + feDisplacementMap */}
          <filter
            id={`rough-ink-${safeId}`}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            filterUnits="userSpaceOnUse"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.042 0.042"
              numOctaves="3"
              result="noise"
              seed={(hash % 97) + 1}
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="2.6"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
          </filter>

          {/* Gold Foil Shimmer Gradient for legendary rarity */}
          <linearGradient
            id={`gold-grad-${safeId}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#A57F2C" />
            <stop offset="30%" stopColor="#F2DC8A" />
            <stop offset="50%" stopColor="#FFF9E6" />
            <stop offset="70%" stopColor="#F2DC8A" />
            <stop offset="100%" stopColor="#C9A24B" />
          </linearGradient>

          {/* Curved text paths for each shape */}
          {/* Circle top arc path */}
          <path
            id={`arc-circle-${safeId}`}
            d="M 26 80 A 54 54 0 0 1 134 80"
            fill="none"
          />
          {/* Oval top arc path */}
          <path
            id={`arc-oval-${safeId}`}
            d="M 24 80 A 56 38 0 0 1 136 80"
            fill="none"
          />
          {/* Rectangle top arch path */}
          <path
            id={`arc-rect-${safeId}`}
            d="M 24 52 Q 80 36 136 52"
            fill="none"
          />
          {/* Hexagon top arch path */}
          <path
            id={`arc-hex-${safeId}`}
            d="M 26 56 Q 80 28 134 56"
            fill="none"
          />
        </defs>

        {/* Group with rough ink displacement filter */}
        <g
          filter={`url(#rough-ink-${safeId})`}
          stroke={inkColor}
          fill={inkColor}
        >
          {/* 1. CIRCLE SHAPE */}
          {shape === 'circle' && (
            <g>
              {/* Outer circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                strokeWidth="2.5"
                strokeDasharray="5 2.5"
              />
              {/* Inner solid ring */}
              <circle
                cx="80"
                cy="80"
                r="64"
                fill="none"
                strokeWidth="1.8"
              />

              {/* Top Curved Text */}
              <text
                fontFamily="'Big Shoulders Display', sans-serif"
                fontSize="15"
                fontWeight="800"
                letterSpacing="0.08em"
                stroke="none"
              >
                <textPath
                  href={`#arc-circle-${safeId}`}
                  startOffset="50%"
                  textAnchor="middle"
                >
                  {displayTitle}
                </textPath>
              </text>

              {/* Decorative separator stars */}
              <g stroke="none" transform="translate(80, 72) scale(0.85)">
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  fontFamily="'Special Elite', monospace"
                  fontSize="10"
                >
                  ★ ★ ★
                </text>
              </g>

              {/* Date in center */}
              <text
                x="80"
                y="91"
                textAnchor="middle"
                fontFamily="'Special Elite', monospace"
                fontSize="12"
                fontWeight="700"
                letterSpacing="0.05em"
                stroke="none"
              >
                {formattedDate}
              </text>

              {/* Bottom Subtitle */}
              <text
                x="80"
                y="118"
                textAnchor="middle"
                fontFamily="'Big Shoulders Display', sans-serif"
                fontSize="11"
                fontWeight="700"
                letterSpacing="0.1em"
                stroke="none"
              >
                {displaySub}
              </text>
            </g>
          )}

          {/* 2. OVAL SHAPE */}
          {shape === 'oval' && (
            <g>
              {/* Outer oval */}
              <ellipse
                cx="80"
                cy="80"
                rx="72"
                ry="54"
                fill="none"
                strokeWidth="2.5"
              />
              {/* Inner dashed oval */}
              <ellipse
                cx="80"
                cy="80"
                rx="65"
                ry="47"
                fill="none"
                strokeWidth="1.2"
                strokeDasharray="4 2"
              />

              {/* Top Curved Text */}
              <text
                fontFamily="'Big Shoulders Display', sans-serif"
                fontSize="14"
                fontWeight="800"
                letterSpacing="0.06em"
                stroke="none"
              >
                <textPath
                  href={`#arc-oval-${safeId}`}
                  startOffset="50%"
                  textAnchor="middle"
                >
                  {displayTitle}
                </textPath>
              </text>

              {/* Center separator line */}
              <line
                x1="35"
                y1="75"
                x2="125"
                y2="75"
                strokeWidth="1.2"
                strokeDasharray="3 2"
              />

              {/* Date in center */}
              <text
                x="80"
                y="91"
                textAnchor="middle"
                fontFamily="'Special Elite', monospace"
                fontSize="12"
                fontWeight="700"
                stroke="none"
              >
                {formattedDate}
              </text>

              {/* Bottom Subtitle */}
              <text
                x="80"
                y="112"
                textAnchor="middle"
                fontFamily="'Big Shoulders Display', sans-serif"
                fontSize="10"
                fontWeight="700"
                letterSpacing="0.12em"
                stroke="none"
              >
                {displaySub}
              </text>
            </g>
          )}

          {/* 3. RECTANGLE SHAPE */}
          {shape === 'rectangle' && (
            <g>
              {/* Outer rounded rect */}
              <rect
                x="10"
                y="18"
                width="140"
                height="124"
                rx="10"
                fill="none"
                strokeWidth="2.8"
              />
              {/* Inner thin rect */}
              <rect
                x="15"
                y="23"
                width="130"
                height="114"
                rx="7"
                fill="none"
                strokeWidth="1"
              />

              {/* Top Curved / Arched Title */}
              <text
                fontFamily="'Big Shoulders Display', sans-serif"
                fontSize="14"
                fontWeight="800"
                letterSpacing="0.08em"
                stroke="none"
              >
                <textPath
                  href={`#arc-rect-${safeId}`}
                  startOffset="50%"
                  textAnchor="middle"
                >
                  {displayTitle}
                </textPath>
              </text>

              {/* Dividing dotted line */}
              <line
                x1="24"
                y1="68"
                x2="136"
                y2="68"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Date */}
              <text
                x="80"
                y="88"
                textAnchor="middle"
                fontFamily="'Special Elite', monospace"
                fontSize="13"
                fontWeight="700"
                letterSpacing="0.06em"
                stroke="none"
              >
                {formattedDate}
              </text>

              {/* Secondary rule */}
              <line
                x1="32"
                y1="98"
                x2="128"
                y2="98"
                strokeWidth="1"
              />

              {/* Bottom Subtitle */}
              <text
                x="80"
                y="118"
                textAnchor="middle"
                fontFamily="'Big Shoulders Display', sans-serif"
                fontSize="11"
                fontWeight="700"
                letterSpacing="0.14em"
                stroke="none"
              >
                {displaySub}
              </text>
            </g>
          )}

          {/* 4. HEXAGON SHAPE */}
          {shape === 'hexagon' && (
            <g>
              {/* Outer hexagon: chamfered polygon */}
              <polygon
                points="80,10 148,46 148,114 80,150 12,114 12,46"
                fill="none"
                strokeWidth="2.6"
              />
              {/* Inner hexagon */}
              <polygon
                points="80,16 142,49 142,111 80,144 18,111 18,49"
                fill="none"
                strokeWidth="1.2"
                strokeDasharray="4 2.5"
              />

              {/* Top Arched Title */}
              <text
                fontFamily="'Big Shoulders Display', sans-serif"
                fontSize="14"
                fontWeight="800"
                letterSpacing="0.08em"
                stroke="none"
              >
                <textPath
                  href={`#arc-hex-${safeId}`}
                  startOffset="50%"
                  textAnchor="middle"
                >
                  {displayTitle}
                </textPath>
              </text>

              {/* Center icon / emblem */}
              <g stroke="none" transform="translate(80, 72) scale(0.9)">
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  fontFamily="'Special Elite', monospace"
                  fontSize="11"
                >
                  ◆ ◆ ◆
                </text>
              </g>

              {/* Date */}
              <text
                x="80"
                y="92"
                textAnchor="middle"
                fontFamily="'Special Elite', monospace"
                fontSize="12"
                fontWeight="700"
                letterSpacing="0.06em"
                stroke="none"
              >
                {formattedDate}
              </text>

              {/* Bottom Subtitle */}
              <text
                x="80"
                y="120"
                textAnchor="middle"
                fontFamily="'Big Shoulders Display', sans-serif"
                fontSize="10"
                fontWeight="700"
                letterSpacing="0.12em"
                stroke="none"
              >
                {displaySub}
              </text>
            </g>
          )}
        </g>

        {/* OVERSTAMP BANNERS */}
        {showOverstamp && isRare && (
          <g
            transform="translate(80, 80) rotate(-14) translate(-80, -80)"
            filter={`url(#rough-ink-${safeId})`}
          >
            <rect
              x="22"
              y="68"
              width="116"
              height="24"
              fill="#B23A2B"
              fillOpacity="0.16"
              stroke="#B23A2B"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <text
              x="80"
              y="84"
              textAnchor="middle"
              fontFamily="'Big Shoulders Display', sans-serif"
              fontSize="14"
              fontWeight="900"
              letterSpacing="0.18em"
              fill="#B23A2B"
              stroke="none"
            >
              RARE FIND
            </text>
          </g>
        )}

        {showOverstamp && isLegendary && (
          <g
            transform="translate(80, 80) rotate(-10) translate(-80, -80)"
            filter={`url(#rough-ink-${safeId})`}
          >
            <rect
              x="16"
              y="66"
              width="128"
              height="26"
              fill={`url(#gold-grad-${safeId})`}
              fillOpacity="0.22"
              stroke={`url(#gold-grad-${safeId})`}
              strokeWidth="2.4"
            />
            <text
              x="80"
              y="84"
              textAnchor="middle"
              fontFamily="'Big Shoulders Display', sans-serif"
              fontSize="14"
              fontWeight="900"
              letterSpacing="0.2em"
              fill={`url(#gold-grad-${safeId})`}
              stroke="none"
            >
              ★ LEGENDARY ★
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
