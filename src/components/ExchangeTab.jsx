import React, { useState, useEffect, useCallback } from 'react'
import { usePassport, useVisited, useFinds } from '../lib/store'
import {
  encodePassport,
  decodePassport,
  friendlyDecodeError,
  SAMPLE_PASSPORTS,
  buildSampleCode,
  bitsetToVisited,
} from '../lib/exchange'
import { SEEDED_FINDS } from '../data/finds'
import { COUNTRIES } from '../data/countries'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a display name for a country iso2 code */
function countryName(iso2) {
  const c = COUNTRIES.find((c) => c.iso2 === iso2)
  return c ? c.name : iso2
}

/** Ink colour for a mini stamp dot */
function stampColor(i) {
  const colors = ['#2A4B9B', '#B23A2B', '#2F6B4F', '#5B3F8C']
  return colors[i % colors.length]
}

/** Deterministic seed-stable tilt in degrees for mini stamps */
function miniTilt(iso2) {
  let h = 0
  for (let i = 0; i < iso2.length; i++) h = ((h << 5) - h + iso2.charCodeAt(i)) | 0
  return (((Math.abs(h) % 120) - 60) / 20).toFixed(1)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Small ink stamp badge used in the "countries in common" row */
function MiniStamp({ iso2, index }) {
  const tilt = miniTilt(iso2)
  const color = stampColor(index)
  const label = iso2.toUpperCase()

  return (
    <span
      title={countryName(iso2)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        border: `2px solid ${color}`,
        color,
        fontFamily: '"Big Shoulders Display", sans-serif',
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: '0.05em',
        transform: `rotate(${tilt}deg)`,
        mixBlendMode: 'multiply',
        flexShrink: 0,
        userSelect: 'none',
        borderRadius: index % 3 === 0 ? '50%' : index % 3 === 1 ? '4px' : '2px',
        opacity: 0.88,
      }}
    >
      {label}
    </span>
  )
}

/** Horizontal rule that looks like a customs form divider */
function FormRule({ label }) {
  return (
    <div className="flex items-center gap-2 my-4">
      <div className="flex-1 h-px bg-ink/30" />
      {label && (
        <span
          className="text-[9px] tracking-widest uppercase font-typewriter text-ink/55 whitespace-nowrap"
        >
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-ink/30" />
    </div>
  )
}

/** Holder card (stamped passport header) for one traveller */
function HolderLine({ name, home, visitedCount, totalFinds, side }) {
  const sideLabel = side === 'you' ? 'HOLDER A — YOU' : 'HOLDER B — THEM'
  return (
    <div
      className="flex-1 border border-ink/40 p-3 bg-paper-shadow/30 min-w-0"
      style={{ borderLeft: side === 'you' ? '3px solid #2A4B9B' : '3px solid #B23A2B' }}
    >
      <div className="text-[9px] tracking-widest uppercase font-typewriter text-ink/55 mb-1">
        {sideLabel}
      </div>
      <div
        className="font-typewriter font-bold text-sm text-ink truncate"
        style={{ fontFamily: '"Special Elite", monospace' }}
      >
        {name}
      </div>
      <div className="font-typewriter text-[11px] text-ink/70 mt-0.5">
        Home: <span className="font-bold">{home}</span>
      </div>
      <div className="font-typewriter text-[11px] text-ink/70">
        Countries: <span className="font-bold">{visitedCount}</span>
      </div>
      <div className="font-typewriter text-[11px] text-ink/70">
        Finds: <span className="font-bold">{totalFinds}</span>
      </div>
    </div>
  )
}

// ─── Main ExchangeTab ─────────────────────────────────────────────────────────

export default function ExchangeTab({ onResetPassport }) {
  const [passport] = usePassport()
  const [visited] = useVisited()
  const [finds] = useFinds()

  // Share code state
  const [myCode, setMyCode] = useState('')
  const [copyStatus, setCopyStatus] = useState('idle') // idle | copied | error

  // Paste field state
  const [pasteValue, setPasteValue] = useState('')
  const [pasteError, setPasteError] = useState('')
  const [decoded, setDecoded] = useState(null)  // decoded passport descriptor

  // ── Generate my code on mount / when data changes ──
  useEffect(() => {
    if (!passport) return
    try {
      const code = encodePassport(passport, visited || {}, finds || {}, SEEDED_FINDS)
      setMyCode(code)
    } catch {
      setMyCode('')
    }
  }, [passport, visited, finds])

  // ── Check for hash route  /#/x/<code> ──
  useEffect(() => {
    // The HashRouter exposes its fragment, but we need to peek inside it:
    // window.location.hash = "#/x/LC1.eyJ..."
    const hash = window.location.hash || ''
    const match = hash.match(/^#\/x\/(.+)/)
    if (match) {
      const code = decodeURIComponent(match[1])
      setPasteValue(code)
      tryDecode(code)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tryDecode = useCallback((code) => {
    setPasteError('')
    setDecoded(null)
    const trimmed = (code || '').trim()
    if (!trimmed) return
    try {
      const result = decodePassport(trimmed)
      setDecoded(result)
    } catch (err) {
      setPasteError(friendlyDecodeError(err.message))
    }
  }, [])

  // ── Share link ──
  const shareLink = myCode
    ? `${window.location.origin}${window.location.pathname}#/x/${encodeURIComponent(myCode)}`
    : ''

  // ── Copy handler ──
  const handleCopy = useCallback(async (text, field = 'code') => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        setCopyStatus(field === 'link' ? 'copied-link' : 'copied-code')
        setTimeout(() => setCopyStatus('idle'), 2500)
      }
    } catch {
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 2500)
    }
  }, [])

  // ── Share handler ──
  const handleShare = useCallback(async () => {
    if (!myCode) return
    const shareData = {
      title: `${passport?.name}'s Layover Passport`,
      text: `Compare travel passports with me on Layover Passport!`,
      url: shareLink,
    }
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy link
        await handleCopy(shareLink, 'link')
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        handleCopy(shareLink, 'link')
      }
    }
  }, [myCode, passport, shareLink, handleCopy])

  // ── Paste / decode ──
  const handlePasteChange = (e) => {
    const val = e.target.value
    setPasteValue(val)
    setPasteError('')
    if (!val.trim()) {
      setDecoded(null)
    }
  }

  const handlePasteSubmit = (e) => {
    e.preventDefault()
    tryDecode(pasteValue)
  }

  // ── Load sample passport ──
  const handleLoadSample = (sample) => {
    const code = buildSampleCode(sample.persona)
    setPasteValue(code)
    setPasteError('')
    try {
      const result = decodePassport(code)
      setDecoded(result)
    } catch (err) {
      setPasteError(friendlyDecodeError(err.message))
    }
  }

  // ── Compute comparison when decoded ──
  const comparison = (() => {
    if (!decoded) return null

    const myVisitedSet = new Set(Object.keys(visited || {}).map((k) => k.toUpperCase()))
    const theirVisitedSet = new Set(decoded.visitedList.map((k) => k.toUpperCase()))

    const inCommon = [...myVisitedSet].filter((iso2) => theirVisitedSet.has(iso2))
    const youNotThem = [...myVisitedSet].filter((iso2) => !theirVisitedSet.has(iso2))
    const themNotYou = [...theirVisitedSet].filter((iso2) => !myVisitedSet.has(iso2))

    const unionSize = new Set([...myVisitedSet, ...theirVisitedSet]).size
    const twinsPct = unionSize > 0 ? Math.round((inCommon.length / unionSize) * 100) : 0

    const myFindsCount = Object.keys(finds || {}).length

    return {
      inCommon,
      youNotThem,
      themNotYou,
      twinsPct,
      myVisitedCount: myVisitedSet.size,
      theirVisitedCount: theirVisitedSet.size,
      myFindsCount,
      theirFindsCount: decoded.totalFinds,
    }
  })()

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-y-auto font-typewriter pb-6 bg-paper">
      {/* ── Sovereign bar ── */}
      <div className="px-4 py-2 border-b border-ink/20 bg-paper-shadow/40 flex items-center justify-between shrink-0">
        <span className="text-[9px] tracking-[0.25em] uppercase text-ink/55">
          SECTION V · EXCHANGE
        </span>
        <span className="text-[9px] tracking-[0.15em] uppercase text-ink/55">
          CUSTOMS DESK
        </span>
      </div>

      <div className="px-4 pt-5 pb-2">
        <h1
          className="text-2xl text-ink mb-0.5"
          style={{ fontFamily: '"IM Fell English", Georgia, serif' }}
        >
          Customs Exchange
        </h1>
        <p className="text-[11px] tracking-widest text-ink/60 uppercase mb-0">
          Passport Code Swap &amp; Travel Twin Compare
        </p>
      </div>

      <div className="px-4">
        <FormRule label="YOUR DISPATCH CODE" />

        {/* ── My Code block ── */}
        <div
          className="border-2 border-ink bg-paper-shadow/20 p-4 mb-4"
          style={{ position: 'relative' }}
        >
          {/* watermark */}
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          >
            <span
              className="text-[80px] font-bold opacity-[0.025] rotate-[-20deg] text-ink"
              style={{ fontFamily: '"Big Shoulders Display", sans-serif', letterSpacing: '-0.05em' }}
            >
              PASSPORT
            </span>
          </div>

          <div className="text-[9px] tracking-widest text-ink/55 uppercase mb-2">
            Your Layover Passport Code
          </div>

          {myCode ? (
            <div
              id="exchange-my-code"
              className="select-all break-all text-sm font-bold tracking-wider text-ink bg-paper border border-ink/30 p-3 leading-relaxed mb-3"
              style={{ fontFamily: '"Special Elite", monospace', wordBreak: 'break-all' }}
            >
              {myCode}
            </div>
          ) : (
            <div className="text-xs text-ink/50 italic p-3 border border-ink/20 mb-3">
              No passport issued yet.
            </div>
          )}

          {/* Code action buttons */}
          <div className="flex gap-2">
            <button
              id="exchange-copy-code-btn"
              type="button"
              onClick={() => handleCopy(myCode)}
              disabled={!myCode}
              className="flex-1 py-2.5 px-3 border-2 border-ink bg-ink text-paper text-[10px] uppercase tracking-widest font-bold min-h-[44px] transition-opacity disabled:opacity-40 hover:opacity-90"
            >
              {copyStatus === 'copied-code' ? '✓ COPIED' : copyStatus === 'error' ? '✗ FAILED' : 'COPY'}
            </button>
            <button
              id="exchange-share-btn"
              type="button"
              onClick={handleShare}
              disabled={!myCode}
              className="flex-1 py-2.5 px-3 border-2 border-ink text-ink text-[10px] uppercase tracking-widest font-bold min-h-[44px] transition-opacity disabled:opacity-40 hover:bg-ink/5"
            >
              SHARE
            </button>
          </div>

          {/* Shareable link */}
          {shareLink && (
            <div className="mt-3">
              <div className="text-[9px] tracking-widest text-ink/55 uppercase mb-1">
                SHAREABLE LINK
              </div>
              <div
                className="flex items-stretch gap-2 border border-ink/30 bg-paper overflow-hidden"
              >
                <div
                  className="flex-1 text-[9px] text-ink/70 p-2 break-all select-all leading-relaxed"
                  style={{ fontFamily: '"Special Elite", monospace' }}
                >
                  {shareLink}
                </div>
                <button
                  id="exchange-copy-link-btn"
                  type="button"
                  onClick={() => handleCopy(shareLink, 'link')}
                  className="shrink-0 px-2 border-l border-ink/30 text-[9px] text-ink/70 uppercase tracking-wider hover:bg-ink/5 min-w-[44px] min-h-[44px]"
                >
                  {copyStatus === 'copied-link' ? '✓' : 'COPY'}
                </button>
              </div>
            </div>
          )}
        </div>

        <FormRule label="INSPECT A FRIEND'S CODE" />

        {/* ── Sample passport chips ── */}
        <div className="mb-3">
          <div className="text-[9px] tracking-widest text-ink/55 uppercase mb-2">
            — TRY A SAMPLE PASSPORT —
          </div>
          <div className="flex gap-2 flex-wrap">
            {SAMPLE_PASSPORTS.map((sample) => (
              <button
                key={sample.label}
                id={`exchange-sample-${sample.label.toLowerCase().replace(/[^a-z]/g, '')}`}
                type="button"
                onClick={() => handleLoadSample(sample)}
                className="border border-ink/60 px-3 py-2 text-[9px] tracking-widest uppercase text-ink hover:bg-ink hover:text-paper transition-colors min-h-[44px] text-left"
              >
                <div className="font-bold">{sample.emoji} {sample.label}</div>
                <div className="text-ink/60 mt-0.5" style={{ fontSize: 8 }}>
                  {sample.subtitle}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Paste field ── */}
        <form onSubmit={handlePasteSubmit} className="mb-4">
          <label
            htmlFor="exchange-paste-input"
            className="block text-[9px] tracking-widest text-ink/55 uppercase mb-1.5"
          >
            ENTER A FRIEND'S CODE
          </label>
          <textarea
            id="exchange-paste-input"
            rows={3}
            value={pasteValue}
            onChange={handlePasteChange}
            placeholder="LC1.eyJ..."
            className="w-full border border-ink/50 bg-paper text-ink p-3 text-xs resize-none focus:outline-none focus:border-ink mb-2"
            style={{ fontFamily: '"Special Elite", monospace' }}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
          {pasteError && (
            <div className="text-[10px] text-stamp-red border border-stamp-red/30 bg-stamp-red/5 px-3 py-2 mb-2 flex items-start gap-2">
              <span className="shrink-0 font-bold">!</span>
              <span>{pasteError}</span>
            </div>
          )}
          <button
            id="exchange-inspect-btn"
            type="submit"
            className="w-full border-2 border-ink bg-ink text-paper py-3 text-[10px] uppercase tracking-widest font-bold min-h-[44px] hover:opacity-90 transition-opacity"
          >
            INSPECT PASSPORT
          </button>
        </form>

        {/* ── Customs Desk compare screen ── */}
        {decoded && comparison && (
          <div
            id="exchange-customs-desk"
            className="border-2 border-ink mb-6"
            style={{ background: '#F9F3E4' }}
          >
            {/* Customs Desk header */}
            <div
              className="bg-ink text-paper px-4 py-3 flex items-center justify-between"
            >
              <span
                className="text-xs tracking-widest uppercase"
                style={{ fontFamily: '"Big Shoulders Display", sans-serif', letterSpacing: '0.2em' }}
              >
                CUSTOMS DESK
              </span>
              <span
                className="text-[9px] tracking-widest uppercase text-paper/70"
              >
                COMPARATIVE ANALYSIS
              </span>
            </div>

            <div className="p-4">
              {/* Guilloche line */}
              <div
                className="h-px mb-4"
                style={{
                  background: 'repeating-linear-gradient(90deg, #1C2B4B 0px, #1C2B4B 4px, transparent 4px, transparent 8px)',
                  opacity: 0.25,
                }}
              />

              {/* Two holder lines */}
              <div className="flex gap-2 mb-4">
                <HolderLine
                  name={(passport?.name || 'YOU').toUpperCase()}
                  home={(passport?.home || '—').toUpperCase()}
                  visitedCount={comparison.myVisitedCount}
                  totalFinds={comparison.myFindsCount}
                  side="you"
                />
                <HolderLine
                  name={decoded.name}
                  home={decoded.home}
                  visitedCount={comparison.theirVisitedCount}
                  totalFinds={comparison.theirFindsCount}
                  side="them"
                />
              </div>

              {/* Travel Twins % */}
              <div
                className="border border-ink/30 p-3 mb-4 flex items-center justify-between bg-paper"
                style={{ background: 'rgba(241,232,210,0.6)' }}
              >
                <div>
                  <div className="text-[9px] tracking-widest uppercase text-ink/55">
                    TRAVEL TWINS %
                  </div>
                  <div className="text-[9px] text-ink/50 mt-0.5">
                    shared ÷ union of visited
                  </div>
                </div>
                <div
                  className="text-4xl font-bold text-ink"
                  style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}
                >
                  {comparison.twinsPct}
                  <span className="text-lg font-normal text-ink/60">%</span>
                </div>
              </div>

              {/* Countries in common */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] tracking-widest uppercase text-ink/55">
                    COUNTRIES IN COMMON
                  </span>
                  <span
                    className="text-xs font-bold text-ink border border-ink/40 px-2 py-0.5"
                    style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}
                  >
                    {comparison.inCommon.length}
                  </span>
                </div>
                {comparison.inCommon.length === 0 ? (
                  <div className="text-xs text-ink/50 italic py-2 text-center border border-dashed border-ink/20">
                    No countries in common yet — time to travel!
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 py-2">
                    {comparison.inCommon.map((iso2, i) => (
                      <MiniStamp key={iso2} iso2={iso2} index={i} />
                    ))}
                  </div>
                )}
              </div>

              <div
                className="h-px mb-4"
                style={{
                  background: 'repeating-linear-gradient(90deg, #1C2B4B 0px, #1C2B4B 2px, transparent 2px, transparent 6px)',
                  opacity: 0.15,
                }}
              />

              {/* You've been, they haven't */}
              <CountryList
                label="YOU'VE BEEN, THEY HAVEN'T"
                isos={comparison.youNotThem}
                color="#2A4B9B"
                emptyMsg="They've been everywhere you have!"
              />

              {/* They've been, you haven't */}
              <CountryList
                label="THEY'VE BEEN, YOU HAVEN'T"
                isos={comparison.themNotYou}
                color="#B23A2B"
                emptyMsg="You've been everywhere they have!"
              />

              {/* Finds totals */}
              <div
                className="border-t border-ink/20 pt-3 mt-2 flex gap-4"
              >
                <div className="flex-1 text-center">
                  <div className="text-[9px] tracking-wider uppercase text-ink/50 mb-0.5">Your Finds</div>
                  <div
                    className="text-2xl font-bold text-ink"
                    style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}
                  >
                    {comparison.myFindsCount}
                  </div>
                </div>
                <div className="w-px bg-ink/20" />
                <div className="flex-1 text-center">
                  <div className="text-[9px] tracking-wider uppercase text-ink/50 mb-0.5">Their Finds</div>
                  <div
                    className="text-2xl font-bold text-ink"
                    style={{ fontFamily: '"Big Shoulders Display", sans-serif' }}
                  >
                    {decoded.totalFinds}
                  </div>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                id="exchange-dismiss-btn"
                type="button"
                onClick={() => { setDecoded(null); setPasteValue(''); setPasteError('') }}
                className="mt-4 w-full border border-ink/30 py-2 text-[9px] uppercase tracking-widest text-ink/60 hover:bg-ink/5 transition-colors min-h-[44px]"
              >
                CLEAR COMPARISON
              </button>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        {onResetPassport && (
          <div className="text-center pt-2 pb-4">
            <button
              id="exchange-reset-btn"
              type="button"
              onClick={onResetPassport}
              className="text-[9px] text-stamp-red border border-stamp-red/40 px-3 py-2 hover:bg-stamp-red/5 uppercase tracking-widest min-h-[44px] transition-colors"
            >
              Reset &amp; Re-issue Passport
            </button>
          </div>
        )}

        <div className="text-center pt-4 pb-2 text-[8px] text-ink/35 tracking-[0.3em] uppercase">
          LAYOVER TRANSIT AUTHORITY · SECTION V · EXCHANGE
        </div>
      </div>
    </div>
  )
}

// ─── CountryList ─────────────────────────────────────────────────────────────

function CountryList({ label, isos, color, emptyMsg }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? isos : isos.slice(0, 8)
  const hasMore = isos.length > 8

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] tracking-widest uppercase" style={{ color }}>
          {label}
        </span>
        <span
          className="text-[9px] font-bold border px-1.5 py-0.5"
          style={{ color, borderColor: color, fontFamily: '"Big Shoulders Display", sans-serif' }}
        >
          {isos.length}
        </span>
      </div>
      {isos.length === 0 ? (
        <div className="text-[10px] text-ink/45 italic py-1.5">
          {emptyMsg}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {visible.map((iso2) => (
              <span
                key={iso2}
                className="text-[10px] text-ink/80 font-typewriter"
                title={countryName(iso2)}
              >
                {countryName(iso2)}
              </span>
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((x) => !x)}
              className="text-[9px] tracking-wider uppercase mt-1 text-ink/50 hover:text-ink transition-colors"
            >
              {expanded ? '▲ SHOW LESS' : `▼ +${isos.length - 8} MORE`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
