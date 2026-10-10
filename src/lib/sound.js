/**
 * Synthesized WebAudio thump sound effect for stamp impact.
 * No external audio files used. Fails silently if blocked or unsupported.
 */
let sharedAudioCtx = null

function getAudioContext() {
  try {
    if (typeof window === 'undefined') return null
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx()
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {})
    }
    return sharedAudioCtx
  } catch {
    return null
  }
}

/**
 * Play authentic heavy passport stamp thump
 */
export function playStampThump() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // 1. Low frequency thump (rubber stamp impact through heavy wooden handle)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.14)

    gain.gain.setValueAtTime(0.75, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.17)

    // 2. High frequency snap / paper slap click
    const snapOsc = ctx.createOscillator()
    const snapGain = ctx.createGain()

    snapOsc.type = 'square'
    snapOsc.frequency.setValueAtTime(380, now)
    snapOsc.frequency.exponentialRampToValueAtTime(80, now + 0.04)

    snapGain.gain.setValueAtTime(0.25, now)
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    snapOsc.connect(snapGain)
    snapGain.connect(ctx.destination)

    snapOsc.start(now)
    snapOsc.stop(now + 0.06)
  } catch {
    // Fail silently
  }
}

/**
 * Safe vibration helper
 */
export function triggerStampVibration() {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      navigator.vibrate([18, 40, 12])
    }
  } catch {
    // Fail silently
  }
}
