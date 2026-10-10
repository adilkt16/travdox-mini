import React, { useState, useRef, useEffect, useCallback } from 'react'
import Stamp from './Stamp'
import { playStampThump, triggerStampVibration } from '../lib/sound'

const HOLD_DURATION_MS = 600

function triggerPageShake() {
  if (typeof window === 'undefined') return
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    const target = document.getElementById('root') || document.body
    target.classList.remove('page-shake')
    // Trigger reflow
    void target.offsetWidth
    target.classList.add('page-shake')
    setTimeout(() => {
      target.classList.remove('page-shake')
    }, 260)
  } catch {
    // Fail silently
  }
}

/**
 * <HoldToStamp> interaction wrapper
 * - Press and hold 600ms -> ink ring fills around target area
 * - On release: stamp slams in with scale 1.35->1, 2deg overshoot, ink bloom effect
 * - Page shakes 2px
 * - navigator.vibrate([18, 40, 12]) - fail silently
 * - Synthesized WebAudio thump (no audio files, fail silently if blocked)
 * - Rare -> overstamp banner "RARE FIND"
 * - Legendary -> overstamp banner "LEGENDARY"
 * - Respects prefers-reduced-motion
 * - 44px minimum tap target
 */
export default function HoldToStamp({
  id = 'hold-stamp',
  title = 'VISA',
  subtitle = 'ENTRY',
  rarity = 'common',
  color,
  date,
  isStamped = false,
  onStamp,
  stampSize = 130,
  label = 'HOLD TO STAMP',
  buttonClassName = '',
  className = '',
  disabled = false,
}) {
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isSlamming, setIsSlamming] = useState(false)
  const [bloomActive, setBloomActive] = useState(false)

  const holdTimerRef = useRef(null)
  const startTimeRef = useRef(null)
  const hasTriggeredRef = useRef(false)
  const animFrameRef = useRef(null)

  // Resolve ink color
  let inkColor = color
  if (!inkColor) {
    if (rarity === 'legendary') inkColor = '#C9A24B'
    else if (rarity === 'rare') inkColor = '#B23A2B'
    else inkColor = '#2A4B9B' // common
  }

  const completeStamp = useCallback(() => {
    if (hasTriggeredRef.current || isStamped || disabled) return
    hasTriggeredRef.current = true

    // Check prefers-reduced-motion
    let reducedMotion = false
    if (typeof window !== 'undefined' && window.matchMedia) {
      reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }

    // Audio thump
    playStampThump()

    // Vibration
    triggerStampVibration()

    // Page shake
    if (!reducedMotion) {
      triggerPageShake()
      setIsSlamming(true)
      setBloomActive(true)
      setTimeout(() => setBloomActive(false), 500)
      setTimeout(() => setIsSlamming(false), 350)
    }

    // Trigger onStamp callback
    if (onStamp) {
      onStamp()
    }

    // Reset hold state
    setHolding(false)
    setProgress(0)
  }, [disabled, isStamped, onStamp])

  const startHold = (e) => {
    if (disabled || isStamped) return
    if (e && e.target && typeof e.target.setPointerCapture === 'function' && e.pointerId !== undefined) {
      try {
        e.target.setPointerCapture(e.pointerId)
      } catch {
        // Ignore pointer capture errors
      }
    }
    hasTriggeredRef.current = false
    setHolding(true)
    setProgress(0)
    startTimeRef.current = performance.now()

    // 1. requestAnimationFrame for smooth ring progress
    const updateProgress = () => {
      const now = performance.now()
      const elapsed = now - (startTimeRef.current || now)
      const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100)
      setProgress(pct)

      if (elapsed < HOLD_DURATION_MS) {
        animFrameRef.current = requestAnimationFrame(updateProgress)
      }
    }
    animFrameRef.current = requestAnimationFrame(updateProgress)

    // 2. Guaranteed timer at 600ms: marks 100% full and auto-slams if user keeps pressing
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    holdTimerRef.current = setTimeout(() => {
      setProgress(100)
      completeStamp()
    }, HOLD_DURATION_MS)
  }

  const endHold = (e) => {
    if (e && e.target && typeof e.target.releasePointerCapture === 'function' && e.pointerId !== undefined) {
      try {
        e.target.releasePointerCapture(e.pointerId)
      } catch {
        // Ignore pointer capture errors
      }
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
    }

    if (holding && startTimeRef.current) {
      const elapsed = performance.now() - startTimeRef.current
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)

      if (elapsed >= 550 && !hasTriggeredRef.current) {
        // Slam on release when held >= 600ms (with 50ms buffer)
        completeStamp()
      } else {
        // Released too early
        setHolding(false)
        setProgress(0)
      }
    } else {
      setHolding(false)
      setProgress(0)
    }
  }

  const cancelHold = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    setHolding(false)
    setProgress(0)
  }

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    }
  }, [])

  // If already stamped, render the Stamp component
  if (isStamped) {
    return (
      <div
        className={`relative inline-flex items-center justify-center ${
          isSlamming ? 'animate-stamp-slam' : ''
        } ${className}`}
      >
        {bloomActive && (
          <div
            className="absolute inset-0 rounded-full animate-ink-bloom pointer-events-none"
            style={{
              backgroundColor: inkColor,
              filter: 'blur(8px)',
            }}
            aria-hidden="true"
          />
        )}
        <Stamp
          id={id}
          title={title}
          subtitle={subtitle}
          rarity={rarity}
          color={color}
          date={date}
          size={stampSize}
          showOverstamp={true}
        />
      </div>
    )
  }

  // Ring dimension calculations
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Bloom flash if slamming */}
      {bloomActive && (
        <div
          className="absolute inset-0 rounded-full animate-ink-bloom pointer-events-none z-20"
          style={{
            backgroundColor: inkColor,
            filter: 'blur(6px)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Main Hold-To-Stamp Button Target (Min 44px tap target) */}
      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerCancel={cancelHold}
        onPointerLeave={cancelHold}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            if (!holding) startHold(e)
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            endHold()
          }
        }}
        disabled={disabled}
        aria-label={`Press and hold 600 milliseconds to stamp ${title}`}
        className={`min-h-[44px] min-w-[44px] relative flex items-center justify-center px-4 py-2 select-none border-2 border-ink rounded-xs font-typewriter text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer overflow-hidden touch-none active:scale-[0.98] ${
          holding ? 'bg-paper-shadow shadow-inner' : 'bg-paper-light hover:bg-paper shadow-sm'
        } ${buttonClassName}`}
      >
        {/* Circular Ink Progress Ring */}
        <div
          className={`absolute left-2 w-7 h-7 flex items-center justify-center pointer-events-none transition-opacity ${
            holding || progress > 0 ? 'opacity-100' : 'opacity-40'
          }`}
          aria-hidden="true"
        >
          <svg className="w-full h-full -rotate-90" viewBox="0 0 54 54">
            {/* Background track circle */}
            <circle
              cx="27"
              cy="27"
              r={radius}
              fill="none"
              stroke={inkColor}
              strokeWidth="3"
              strokeOpacity="0.25"
            />
            {/* Filling ink ring */}
            <circle
              cx="27"
              cy="27"
              r={radius}
              fill="none"
              stroke={inkColor}
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-75"
            />
          </svg>
          <span
            className="absolute text-[8px] font-bold"
            style={{ color: inkColor }}
          >
            {holding ? `${Math.round(progress)}%` : '✦'}
          </span>
        </div>

        {/* Button Label with status */}
        <span className="pl-6 font-bold text-ink flex items-center gap-1.5">
          <span>{holding && progress >= 100 ? 'RELEASE TO SLAM!' : label}</span>
          {rarity === 'rare' && (
            <span className="text-[9px] px-1 py-0.5 border border-stamp-red text-stamp-red font-mono">
              RARE
            </span>
          )}
          {rarity === 'legendary' && (
            <span className="text-[9px] px-1 py-0.5 border border-gold text-gold font-mono">
              LEGEND
            </span>
          )}
        </span>

        {/* Authentic rubber stamp pressure shadow when holding */}
        {holding && (
          <div
            className="absolute inset-0 pointer-events-none border-2 border-dashed"
            style={{
              borderColor: inkColor,
              opacity: 0.4 + (progress / 100) * 0.5,
            }}
          />
        )}
      </button>
    </div>
  )
}
