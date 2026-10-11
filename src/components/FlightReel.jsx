import React, { useEffect, useRef, useState, useMemo } from 'react'
import Globe from 'globe.gl'
import * as THREE from 'three'
import { COUNTRIES_BY_ISO2, getStampColor } from '../lib/geo'
import { useVisited, usePassport } from '../lib/store'
import { SEEDED_FINDS } from '../data/finds'
import { playStampThump } from '../lib/sound'
import Crest from './Crest'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFlagEmoji(iso2) {
  if (!iso2 || typeof iso2 !== 'string' || iso2.length !== 2) return '🌐'
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

// Convert lat/lng to 3D unit vector on unit sphere
function latLngToUnitVec(lat, lng) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  )
}

// Convert 3D unit vector back to lat/lng
function unitVecToLatLng(vec) {
  const v = vec.clone().normalize()
  const lat = 90 - Math.acos(Math.max(-1, Math.min(1, v.y))) * (180 / Math.PI)
  let lng = Math.atan2(v.z, -v.x) * (180 / Math.PI) - 180
  while (lng < -180) lng += 360
  while (lng > 180) lng -= 360
  return { lat, lng }
}

// Spherical linear interpolation between two unit vectors (Geodesic Great-Circle)
function slerpVec(v1, v2, t) {
  const dot = Math.max(-1, Math.min(1, v1.dot(v2)))
  const omega = Math.acos(dot)
  if (Math.abs(omega) < 0.0001) return v1.clone()
  const sinOmega = Math.sin(omega)
  const scale1 = Math.sin((1 - t) * omega) / sinOmega
  const scale2 = Math.sin(t * omega) / sinOmega
  return new THREE.Vector3()
    .addScaledVector(v1, scale1)
    .addScaledVector(v2, scale2)
    .normalize()
}

/**
 * 3D Airplane Mesh Model with aerodynamic details and contrail trails
 */
function createAirplaneMesh() {
  const airplane = new THREE.Group()

  const fuselageMat = new THREE.MeshStandardMaterial({
    color: '#FAF8F2',
    metalness: 0.35,
    roughness: 0.3,
  })
  const oxbloodMat = new THREE.MeshStandardMaterial({
    color: '#5A1F26',
    metalness: 0.25,
    roughness: 0.4,
  })
  const goldMat = new THREE.MeshStandardMaterial({
    color: '#C9A24B',
    metalness: 0.8,
    roughness: 0.2,
  })
  const cockpitMat = new THREE.MeshStandardMaterial({
    color: '#1C2B4B',
    metalness: 0.9,
    roughness: 0.1,
  })
  const contrailMat = new THREE.MeshBasicMaterial({
    color: '#FFFFFF',
    transparent: true,
    opacity: 0.35,
  })

  // Fuselage (Cylinder along Z)
  const bodyGeo = new THREE.CylinderGeometry(1.15, 0.7, 14, 16)
  bodyGeo.rotateX(Math.PI / 2)
  const body = new THREE.Mesh(bodyGeo, fuselageMat)
  airplane.add(body)

  // Nose Cone (pointing in +Z)
  const noseGeo = new THREE.ConeGeometry(1.15, 3.8, 16)
  noseGeo.rotateX(Math.PI / 2)
  const nose = new THREE.Mesh(noseGeo, fuselageMat)
  nose.position.z = 8.9
  airplane.add(nose)

  // Cockpit Glass
  const cockpitGeo = new THREE.BoxGeometry(1.4, 0.85, 1.8)
  const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat)
  cockpit.position.set(0, 0.72, 7.3)
  airplane.add(cockpit)

  // Main Swept-back Wings
  const wingGeo = new THREE.BoxGeometry(22, 0.32, 3.4)
  const wings = new THREE.Mesh(wingGeo, fuselageMat)
  wings.position.set(0, 0.1, -0.4)
  airplane.add(wings)

  // Wingtip Gold Accents
  const wingtipLGeo = new THREE.BoxGeometry(0.3, 1.2, 1.8)
  const wingtipL = new THREE.Mesh(wingtipLGeo, goldMat)
  wingtipL.position.set(-11, 0.5, -0.4)
  airplane.add(wingtipL)

  const wingtipR = wingtipL.clone()
  wingtipR.position.set(11, 0.5, -0.4)
  airplane.add(wingtipR)

  // Jet Engines under wings
  const engineGeo = new THREE.CylinderGeometry(0.75, 0.7, 3.4, 12)
  engineGeo.rotateX(Math.PI / 2)
  const engineL = new THREE.Mesh(engineGeo, oxbloodMat)
  engineL.position.set(-4.5, -0.85, 0.8)
  airplane.add(engineL)

  const engineR = new THREE.Mesh(engineGeo, oxbloodMat)
  engineR.position.set(4.5, -0.85, 0.8)
  airplane.add(engineR)

  // Engine Contrail Trails
  const trailGeo = new THREE.CylinderGeometry(0.18, 0.55, 10, 8)
  trailGeo.rotateX(Math.PI / 2)
  const trailL = new THREE.Mesh(trailGeo, contrailMat)
  trailL.position.set(-4.5, -0.85, -5.5)
  airplane.add(trailL)

  const trailR = new THREE.Mesh(trailGeo, contrailMat)
  trailR.position.set(4.5, -0.85, -5.5)
  airplane.add(trailR)

  // Tail Vertical Fin
  const finGeo = new THREE.BoxGeometry(0.3, 4.2, 3.2)
  const fin = new THREE.Mesh(finGeo, oxbloodMat)
  fin.position.set(0, 2.2, -6.2)
  fin.rotation.x = -0.3
  airplane.add(fin)

  // Tail Fin Gold Crown Tip
  const finTipGeo = new THREE.BoxGeometry(0.35, 0.8, 1.5)
  const finTip = new THREE.Mesh(finTipGeo, goldMat)
  finTip.position.set(0, 4.1, -6.8)
  airplane.add(finTip)

  // Tail Horizontal Stabilizers
  const tailWingGeo = new THREE.BoxGeometry(7.5, 0.22, 2.0)
  const tailWings = new THREE.Mesh(tailWingGeo, fuselageMat)
  tailWings.position.set(0, 0.6, -6.5)
  airplane.add(tailWings)

  // Scale suitable for Globe.gl sphere
  airplane.scale.set(0.19, 0.19, 0.19)
  return airplane
}

// Sample World Tour Route (used as fallback or preview if traveler has < 2 countries)
const SAMPLE_GRAND_TOUR = [
  { iso2: 'IN', note: 'New Delhi — Sovereign Departure' },
  { iso2: 'AE', note: 'Dubai — Arabian Desert Crossing' },
  { iso2: 'IT', note: 'Rome — Mediterranean Gateway' },
  { iso2: 'FR', note: 'Paris — Continental Hub' },
  { iso2: 'GB', note: 'London — Meridian Transit' },
  { iso2: 'JP', note: 'Tokyo — Pacific Terminus' },
]

export default function FlightReel({ onClose }) {
  const [passport] = usePassport()
  const [visited] = useVisited()

  const containerRef = useRef(null)
  const globeRef = useRef(null)
  const airplaneObjRef = useRef(null)
  const animFrameRef = useRef(null)

  // DOM Refs for butter-smooth 60fps updates without React DOM re-render lag
  const progressBarRef = useRef(null)
  const altDisplayRef = useRef(null)
  const spdDisplayRef = useRef(null)
  const percentDisplayRef = useRef(null)

  // Animation values stored in refs for zero-jitter rendering
  const progressRef = useRef(0)
  const legIndexRef = useRef(0)
  const camLatRef = useRef(20)
  const camLngRef = useRef(0)
  const isPlayingRef = useRef(true)
  const playbackSpeedRef = useRef(1)

  // React State for macro UI
  const [routeMode, setRouteMode] = useState('auto')
  const [isPlaying, setIsPlaying] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1) // 1x, 1.5x, 2.5x
  const [aspectRatio, setAspectRatio] = useState('full') // 'full' | 'story' (9:16) | 'cinema' (16:9)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)
  const [currentLegIndex, setCurrentLegIndex] = useState(0)
  const [landedAlert, setLandedAlert] = useState(null)

  // Keep refs in sync with React state
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed
  }, [playbackSpeed])

  // 1. Determine Itinerary Waypoints
  const itinerary = useMemo(() => {
    const visitedIsoList = visited ? Object.keys(visited) : []
    const homeIso = (passport?.home || 'IN').toUpperCase()

    if (routeMode === 'auto' && visitedIsoList.length >= 2) {
      const sorted = Object.entries(visited)
        .map(([iso2, date]) => ({ iso2: iso2.toUpperCase(), date }))
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

      const route = []
      const hasHome = sorted.some((item) => item.iso2 === homeIso)
      if (!hasHome) {
        const homeDef = COUNTRIES_BY_ISO2.get(homeIso)
        if (homeDef) route.push({ iso2: homeIso, date: passport?.issuedAt })
      }
      route.push(...sorted)

      return route
        .map((item) => {
          const c = COUNTRIES_BY_ISO2.get(item.iso2)
          return c
            ? {
                iso2: c.iso2,
                name: c.name,
                lat: c.lat,
                lng: c.lng,
                date: item.date,
              }
            : null
        })
        .filter(Boolean)
    }

    return SAMPLE_GRAND_TOUR.map((item) => {
      const c = COUNTRIES_BY_ISO2.get(item.iso2)
      return {
        iso2: item.iso2,
        name: c ? c.name : item.iso2,
        lat: c ? c.lat : 0,
        lng: c ? c.lng : 0,
        date: visited?.[item.iso2] || 'SCHEDULED',
        note: item.note,
      }
    })
  }, [visited, passport, routeMode])

  // 2. Flight Legs between waypoints
  const flightLegs = useMemo(() => {
    if (itinerary.length < 2) return []
    const legs = []
    for (let i = 0; i < itinerary.length - 1; i++) {
      const from = itinerary[i]
      const to = itinerary[i + 1]
      const dist = haversineDistanceKm(from.lat, from.lng, to.lat, to.lng)
      legs.push({
        index: i,
        from,
        to,
        distanceKm: dist,
        unitV1: latLngToUnitVec(from.lat, from.lng),
        unitV2: latLngToUnitVec(to.lat, to.lng),
      })
    }
    return legs
  }, [itinerary])

  const totalJourneyKm = useMemo(() => {
    return flightLegs.reduce((acc, leg) => acc + leg.distanceKm, 0)
  }, [flightLegs])

  // Arcs for completed, current, and upcoming legs
  const arcsData = useMemo(() => {
    return flightLegs.map((leg, idx) => {
      const isCompleted = idx < currentLegIndex
      const isCurrent = idx === currentLegIndex
      return {
        startLat: leg.from.lat,
        startLng: leg.from.lng,
        endLat: leg.to.lat,
        endLng: leg.to.lng,
        color: isCompleted
          ? ['#C9A24B', '#F2DC8A']
          : isCurrent
          ? ['#5A1F26', '#C9A24B']
          : ['rgba(28,43,75,0.15)', 'rgba(28,43,75,0.15)'],
        stroke: isCurrent ? 2.6 : isCompleted ? 1.8 : 0.8,
        altitude: isCurrent ? 0.22 : 0.16,
      }
    })
  }, [flightLegs, currentLegIndex])

  // Rings for visited waypoints
  const ringsData = useMemo(() => {
    return itinerary.map((c, idx) => ({
      lat: c.lat,
      lng: c.lng,
      color: idx <= currentLegIndex ? '#C9A24B' : 'rgba(28,43,75,0.3)',
      maxR: idx === currentLegIndex ? 4.5 : 2.5,
      propagationSpeed: idx === currentLegIndex ? 1.6 : 0.8,
      repeatPeriod: idx === currentLegIndex ? 800 : 1600,
    }))
  }, [itinerary, currentLegIndex])

  // Current flight leg
  const currentLeg = flightLegs[currentLegIndex] || flightLegs[0]

  // Initialize Globe once
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || 390
    const height = container.clientHeight || 600

    const globe = Globe()(container)
      .width(width)
      .height(height)
      .backgroundColor('rgba(0,0,0,0)')
      .showAtmosphere(true)
      .atmosphereColor('#F2DC8A')
      .atmosphereAltitude(0.14)
      .showGraticules(true)
      .globeMaterial(
        new THREE.MeshLambertMaterial({
          color: '#BFD0CC', // Pale vintage sea-green
        })
      )
      .polygonCapCurvatureResolution(2)
      .polygonAltitude(0.005)
      .polygonSideColor(() => 'rgba(0,0,0,0)')
      .polygonStrokeColor(() => '#1C2B4B')
      .pointAltitude(0.008)
      .pointRadius(0.65)
      .pointColor((d) => getStampColor(d.iso2))
      .arcDashLength(0.5)
      .arcDashGap(0.18)
      .arcDashAnimateTime(1600)
      .ringAltitude(0.012)
      .ringColor((d) => d.color)
      .ringMaxRadius((d) => d.maxR)
      .ringPropagationSpeed((d) => d.propagationSpeed)
      .ringRepeatPeriod((d) => d.repeatPeriod)

    // Create 3D Airplane Mesh
    const airplaneMesh = createAirplaneMesh()
    airplaneObjRef.current = airplaneMesh

    globe
      .customLayerData([{ id: 'airplane' }])
      .customThreeObject(() => airplaneMesh)

    // Load Natural Earth GeoJSON for parchment continents
    fetch(`${import.meta.env.BASE_URL}ne_110m.geojson`)
      .then((res) => res.json())
      .then((data) => {
        globe
          .polygonsData(data.features || [])
          .polygonCapColor(() => '#F1E8D2')
      })
      .catch((err) => {
        console.warn('[FlightReel] GeoJSON fallback:', err)
      })

    const controls = globe.controls()
    if (controls) {
      controls.autoRotate = false
      controls.enableDamping = true
      controls.dampingFactor = 0.08
    }

    globeRef.current = globe

    // Set initial camera target from first leg
    if (flightLegs[0]) {
      camLatRef.current = flightLegs[0].from.lat
      camLngRef.current = flightLegs[0].from.lng
      globe.pointOfView({
        lat: camLatRef.current,
        lng: camLngRef.current,
        altitude: 1.95,
      })
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect
        if (w > 0 && h > 0) {
          globe.width(w).height(h)
        }
      }
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // Sync Arcs, Rings, Points with Globe
  useEffect(() => {
    if (!globeRef.current) return
    globeRef.current
      .arcsData(arcsData)
      .ringsData(ringsData)
      .pointsData(itinerary)
  }, [arcsData, ringsData, itinerary])

  // UNIFIED BUTTER-SMOOTH ANIMATION LOOP (60-120fps)
  useEffect(() => {
    if (!globeRef.current || flightLegs.length === 0) return

    let lastTime = performance.now()
    const legBaseDurationMs = 5200 // 5.2s per leg at 1x speed for graceful flight pace

    const loop = (currentTime) => {
      const delta = Math.min(currentTime - lastTime, 50) // prevent huge jump on tab switch
      lastTime = currentTime

      if (isPlayingRef.current) {
        const step = (delta / legBaseDurationMs) * playbackSpeedRef.current
        progressRef.current += step

        if (progressRef.current >= 1) {
          progressRef.current = 0
          playStampThump()

          const nextIdx = (legIndexRef.current + 1) % flightLegs.length
          const reachedCountry = flightLegs[legIndexRef.current]?.to
          legIndexRef.current = nextIdx

          // Update React macro state only on leg changes
          setCurrentLegIndex(nextIdx)

          if (reachedCountry) {
            setLandedAlert({
              country: reachedCountry,
              time: Date.now(),
            })
            setTimeout(() => setLandedAlert(null), 2600)
          }
        }
      }

      // Current leg geometry
      const activeLeg = flightLegs[legIndexRef.current] || flightLegs[0]
      const t = progressRef.current

      if (activeLeg && airplaneObjRef.current && globeRef.current) {
        // Spherical Geodesic Great-Circle Interpolation
        const { unitV1, unitV2 } = activeLeg
        const currentUnitVec = slerpVec(unitV1, unitV2, t)
        const nextT = Math.min(1, t + 0.015)
        const nextUnitVec = slerpVec(unitV1, unitV2, nextT)

        const currentCoords = unitVecToLatLng(currentUnitVec)
        const nextCoords = unitVecToLatLng(nextUnitVec)

        // Smooth parabolic altitude curve (takeoff, cruising at 0.22, landing)
        const currentAlt = 0.045 + Math.sin(t * Math.PI) * 0.18
        const nextAlt = 0.045 + Math.sin(nextT * Math.PI) * 0.18

        const pCurrentRaw = globeRef.current.getCoords(currentCoords.lat, currentCoords.lng, currentAlt)
        const pNextRaw = globeRef.current.getCoords(nextCoords.lat, nextCoords.lng, nextAlt)

        if (pCurrentRaw && pNextRaw) {
          const vCurrent = new THREE.Vector3(pCurrentRaw.x, pCurrentRaw.y, pCurrentRaw.z)
          const vNext = new THREE.Vector3(pNextRaw.x, pNextRaw.y, pNextRaw.z)

          const obj = airplaneObjRef.current
          obj.position.copy(vCurrent)

          // Tangent forward direction and normal vectors
          const forward = new THREE.Vector3().subVectors(vNext, vCurrent).normalize()
          const up = vCurrent.clone().normalize()
          const right = new THREE.Vector3().crossVectors(forward, up).normalize()
          const correctedUp = new THREE.Vector3().crossVectors(right, forward).normalize()

          // Pitch angle: pitch up on takeoff (+8°), level at cruise, pitch down on descent (-6°)
          let pitchAngle = 0
          if (t < 0.25) {
            pitchAngle = Math.sin((t / 0.25) * (Math.PI / 2)) * 0.14
          } else if (t > 0.75) {
            pitchAngle = -Math.sin(((t - 0.75) / 0.25) * (Math.PI / 2)) * 0.1
          }

          // Build orientation matrix
          const m = new THREE.Matrix4()
          m.makeBasis(right, correctedUp, forward)
          obj.quaternion.setFromRotationMatrix(m)

          // Apply gentle pitch adjustment
          if (pitchAngle !== 0) {
            obj.rotateX(pitchAngle)
          }

          // BUTTER-SMOOTH CAMERA TRACKING WITH EXPONENTIAL DAMPING
          // Smoothly track airplane latitude and longitude without frame-canceling tweens
          const targetLat = currentCoords.lat
          const targetLng = currentCoords.lng

          // Handle 180/-180 longitude meridian wrap smoothly
          let dLng = targetLng - camLngRef.current
          while (dLng > 180) dLng -= 360
          while (dLng < -180) dLng += 360

          const camDamp = 0.055 // Silky smooth drone chase camera
          camLatRef.current += (targetLat - camLatRef.current) * camDamp
          camLngRef.current += dLng * camDamp

          // Instantaneous frame update (duration=0) avoids tween fighting
          globeRef.current.pointOfView({
            lat: camLatRef.current,
            lng: camLngRef.current,
            altitude: 1.95,
          })

          // Update live DOM telemetries without triggering React re-renders
          const totalProgressPct = Math.min(
            100,
            Math.round(((legIndexRef.current + t) / flightLegs.length) * 100)
          )

          if (progressBarRef.current) {
            progressBarRef.current.style.width = `${totalProgressPct}%`
          }
          if (percentDisplayRef.current) {
            percentDisplayRef.current.textContent = `${totalProgressPct}%`
          }
          if (altDisplayRef.current) {
            const liveAlt = Math.round(28000 + Math.sin(t * Math.PI) * 8500)
            altDisplayRef.current.textContent = `ALT: ${liveAlt.toLocaleString()} FT`
          }
          if (spdDisplayRef.current) {
            const liveSpd = Math.round(760 + Math.sin(t * Math.PI) * 160)
            spdDisplayRef.current.textContent = `SPD: ${liveSpd} KM/H`
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [flightLegs])

  // Playback Controls Handlers
  const handleTogglePlay = () => {
    setIsPlaying((prev) => {
      isPlayingRef.current = !prev
      return !prev
    })
  }

  const handleRestart = () => {
    progressRef.current = 0
    legIndexRef.current = 0
    setCurrentLegIndex(0)
    setIsPlaying(true)
    isPlayingRef.current = true

    if (flightLegs[0]) {
      camLatRef.current = flightLegs[0].from.lat
      camLngRef.current = flightLegs[0].from.lng
    }
  }

  const handleSelectLeg = (legIdx) => {
    progressRef.current = 0
    legIndexRef.current = legIdx
    setCurrentLegIndex(legIdx)

    if (flightLegs[legIdx]) {
      camLatRef.current = flightLegs[legIdx].from.lat
      camLngRef.current = flightLegs[legIdx].from.lng
    }
  }

  const handleCycleSpeed = () => {
    setPlaybackSpeed((s) => {
      const next = s === 1 ? 1.5 : s === 1.5 ? 2.5 : 1
      playbackSpeedRef.current = next
      return next
    })
  }

  // Active arrival and departure countries
  const arrivalCountry = currentLeg ? currentLeg.to : itinerary[0]
  const departureCountry = currentLeg ? currentLeg.from : itinerary[0]

  // Landmarks in arrival country
  const arrivalLandmarks = useMemo(() => {
    if (!arrivalCountry) return []
    const list = SEEDED_FINDS[arrivalCountry.iso2] || []
    return list.filter((f) => f.category === 'landmark').slice(0, 2)
  }, [arrivalCountry])

  // Share Reel Action
  const handleCopyShareDetails = () => {
    const routeString = itinerary.map((c) => `${getFlagEmoji(c.iso2)} ${c.name}`).join(' ➔ ')
    const shareText = `🎬 LAYOVER EXPEDITION FLIGHT REEL
Traveler: ${passport?.name || 'Citizen'} (No. ${passport?.no || 'LC-0000'})
Total Traversed: ${totalJourneyKm.toLocaleString()} KM across ${itinerary.length} Nations
Flight Route:
${routeString}

Verified by Layover Transit Authority
Watch the 3D globe flight replay on Layover Passport!`

    navigator.clipboard?.writeText(shareText)
    setCopiedShare(true)
    setTimeout(() => setCopiedShare(false), 2400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 select-none font-typewriter">
      {/* Video Reel Framing Container */}
      <div
        className={`w-full h-full sm:max-h-[92vh] bg-paper shadow-2xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 border-2 border-ink/40 ${
          aspectRatio === 'story'
            ? 'max-w-[420px] rounded-2xl'
            : aspectRatio === 'cinema'
            ? 'max-w-[860px] rounded-lg'
            : 'max-w-[540px]'
        }`}
      >
        {/* Retro Film Grain & Vignette */}
        <div
          className="absolute inset-0 pointer-events-none z-20 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(28,43,75,0.4) 100%)',
          }}
        />

        {/* 1. TOP VIDEO HEADER HUD */}
        <header className="px-3 py-2 bg-paper-shadow/95 border-b-2 border-ink/40 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-2">
            {/* Blinking REC indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-stamp-red/10 border border-stamp-red/40 rounded-xs">
              <span className="w-2 h-2 rounded-full bg-stamp-red animate-ping" />
              <span className="text-[9px] font-bold text-stamp-red tracking-widest uppercase">
                REC
              </span>
            </div>

            <div>
              <div className="text-[10px] font-bold text-ink tracking-wider uppercase leading-none">
                EXPEDITION ROUTE REEL
              </div>
              <div className="text-[8px] text-ink/60 tracking-widest uppercase mt-0.5">
                FLIGHT {passport?.no || 'LC-0000'} • {itinerary.length} NATIONS
              </div>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5">
            {/* Aspect Ratio Toggle */}
            <button
              type="button"
              onClick={() =>
                setAspectRatio((r) => (r === 'full' ? 'story' : r === 'story' ? 'cinema' : 'full'))
              }
              title="Toggle Aspect Ratio (Full / 9:16 Story / 16:9 Cinema)"
              className="px-2 py-1 bg-paper border border-ink/30 text-[9px] text-ink hover:bg-paper-shadow cursor-pointer uppercase font-bold"
            >
              {aspectRatio === 'story' ? '9:16' : aspectRatio === 'cinema' ? '16:9' : 'FULL'}
            </button>

            {/* Share / Export Reel Button */}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="px-2.5 py-1 bg-stamp-red text-white border border-stamp-red hover:bg-stamp-red/90 text-[9px] font-bold tracking-wider uppercase cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <span>SHARE REEL</span>
              <span>↗</span>
            </button>

            {/* Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center bg-paper border border-ink/40 text-ink hover:bg-stamp-red hover:text-white cursor-pointer font-bold text-sm transition-colors"
                title="Exit Flight Reel"
              >
                ✕
              </button>
            )}
          </div>
        </header>

        {/* 2. 3D GLOBE CANVAS & LIVE TELEMETRY OVERLAY */}
        <div className="flex-1 relative overflow-hidden bg-[#BFD0CC]/30">
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Golden Corner Vignette Brackets */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#C9A24B] pointer-events-none z-20" />
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#C9A24B] pointer-events-none z-20" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#C9A24B] pointer-events-none z-20" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#C9A24B] pointer-events-none z-20" />

          {/* Live Flight Telemetry Overlay (Top Left) */}
          <div className="absolute top-3 left-3 ml-2 mt-2 bg-paper/90 backdrop-blur-xs border border-ink/30 p-2 shadow-md z-20 text-[9px] flex flex-col gap-0.5 pointer-events-none">
            <div className="flex items-center gap-1 text-[8px] text-ink/60 uppercase tracking-widest font-bold">
              <span>CRUISING TELEMETRY</span>
            </div>
            <div ref={altDisplayRef} className="font-bold text-ink">
              ALT: 36,000 FT
            </div>
            <div ref={spdDisplayRef} className="text-ink/80">
              SPD: 850 KM/H
            </div>
            <div className="text-stamp-blue font-bold">
              LEG {currentLegIndex + 1} OF {flightLegs.length}
            </div>
          </div>

          {/* Current Flight Leg Boarding Pass Overlay (Top Right) */}
          <div className="absolute top-3 right-3 mr-2 mt-2 max-w-[210px] bg-[#F7F1E1]/95 backdrop-blur-xs border-2 border-ink/40 p-2.5 shadow-lg z-20 text-[10px] flex flex-col gap-1">
            <div className="flex items-center justify-between text-[8px] tracking-widest text-ink/60 uppercase font-bold border-b border-ink/20 pb-1">
              <span>ACTIVE AIRWAY</span>
              <span className="text-stamp-red font-bold">IN FLIGHT</span>
            </div>

            <div className="flex items-center justify-between gap-1 my-0.5">
              <div className="text-center">
                <div className="text-base leading-none">{getFlagEmoji(departureCountry?.iso2)}</div>
                <div className="font-bold text-[9px] text-ink mt-0.5">{departureCountry?.iso2}</div>
              </div>
              <div className="flex-1 flex flex-col items-center px-1">
                <span className="text-xs text-stamp-blue">✈ ➔</span>
                <span className="text-[7px] text-ink/60">{currentLeg?.distanceKm.toLocaleString()} KM</span>
              </div>
              <div className="text-center">
                <div className="text-base leading-none">{getFlagEmoji(arrivalCountry?.iso2)}</div>
                <div className="font-bold text-[9px] text-ink mt-0.5">{arrivalCountry?.iso2}</div>
              </div>
            </div>

            <div className="text-[9px] text-ink/80 text-center font-bold truncate">
              {departureCountry?.name} to {arrivalCountry?.name}
            </div>

            {arrivalLandmarks.length > 0 && (
              <div className="mt-1 pt-1 border-t border-ink/15 text-[8px] text-ink/70">
                <span className="font-bold text-stamp-blue">WONDERS EN ROUTE:</span>
                <div className="truncate">{arrivalLandmarks.map((l) => l.title).join(', ')}</div>
              </div>
            )}
          </div>

          {/* Touchdown Alert Banner (Shows when plane lands at a country) */}
          {landedAlert && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#5A1F26] text-[#F2DC8A] px-4 py-3 border-2 border-[#C9A24B] shadow-2xl z-30 flex items-center gap-3 animate-bounce">
              <span className="text-3xl">{getFlagEmoji(landedAlert.country.iso2)}</span>
              <div>
                <div className="text-[9px] text-[#F2DC8A]/80 tracking-widest uppercase">
                  SOVEREIGN TOUCHDOWN CONFIRMED
                </div>
                <div className="text-sm font-bold tracking-wider uppercase">
                  {landedAlert.country.name}
                </div>
              </div>
            </div>
          )}

          {/* Route Mode Switcher Badge (Bottom Left of Canvas) */}
          <div className="absolute bottom-3 left-3 z-20 flex gap-1">
            <button
              type="button"
              onClick={() => {
                setRouteMode((m) => (m === 'auto' ? 'sample' : 'auto'))
                handleRestart()
              }}
              className="px-2 py-1 bg-paper/90 backdrop-blur-xs border border-ink/40 text-[8px] font-bold text-ink hover:bg-paper cursor-pointer uppercase shadow-xs tracking-wider"
            >
              ROUTE: {routeMode === 'auto' ? 'STAMPED LOG' : 'GRAND WORLD TOUR'} (TOGGLE)
            </button>
          </div>
        </div>

        {/* 3. ITINERARY TIMELINE FILMSTRIP (Shows all countries the plane visits) */}
        <div className="bg-[#F7F1E1] border-t-2 border-ink/40 px-3 py-2 z-30 shrink-0">
          <div className="flex items-center justify-between mb-1.5 text-[9px] tracking-wider uppercase text-ink/70 font-bold">
            <span>EXPEDITION ITINERARY ({itinerary.length} STOPS)</span>
            <span>{totalJourneyKm.toLocaleString()} KM TOTAL</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {itinerary.map((stop, i) => {
              const isCurrentStop = i === currentLegIndex + 1
              const isPastStop = i <= currentLegIndex

              return (
                <button
                  key={`${stop.iso2}-${i}`}
                  type="button"
                  onClick={() => handleSelectLeg(Math.min(i, flightLegs.length - 1))}
                  className={`flex items-center gap-2 px-2.5 py-1.5 border transition-all shrink-0 cursor-pointer text-left ${
                    isCurrentStop
                      ? 'bg-stamp-blue text-white border-stamp-blue shadow-sm -translate-y-0.5'
                      : isPastStop
                      ? 'bg-paper text-ink border-ink/40'
                      : 'bg-paper-shadow/60 text-ink/60 border-ink/20 opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className="text-lg leading-none">{getFlagEmoji(stop.iso2)}</span>
                  <div>
                    <div className="font-bold text-[10px] leading-tight truncate max-w-[90px]">
                      {stop.name}
                    </div>
                    <div className="text-[8px] tracking-wider opacity-80 uppercase">
                      STOP {String(i + 1).padStart(2, '0')} • {stop.iso2}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 4. VIDEO PLAYBACK CONTROL BAR */}
        <div className="bg-paper-shadow border-t-2 border-ink/40 p-2.5 z-30 shrink-0 flex flex-col gap-2">
          {/* Journey Scrubber Progress Bar */}
          <div className="flex items-center gap-2">
            <span
              ref={percentDisplayRef}
              className="text-[9px] font-bold text-ink w-8 text-right font-mono"
            >
              0%
            </span>
            <div className="flex-1 bg-paper h-2.5 border border-ink/30 relative rounded-xs overflow-hidden">
              <div
                ref={progressBarRef}
                className="bg-stamp-blue h-full transition-all duration-75 relative w-0"
              >
                <span className="absolute right-0 top-0 bottom-0 w-1 bg-[#F2DC8A]" />
              </div>
            </div>
            <span className="text-[9px] font-bold text-ink/70 uppercase">
              100%
            </span>
          </div>

          {/* Play / Pause / Replay / Speed controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {/* Play / Pause */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className="px-3 py-1.5 bg-ink text-paper hover:bg-ink/90 border border-ink text-xs font-bold tracking-wider uppercase cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span>{isPlaying ? '⏸ PAUSE' : '▶ PLAY'}</span>
              </button>

              {/* Replay */}
              <button
                type="button"
                onClick={handleRestart}
                className="px-2.5 py-1.5 bg-paper hover:bg-paper-shadow border border-ink/40 text-[10px] text-ink font-bold tracking-wider uppercase cursor-pointer"
                title="Restart Expedition Journey"
              >
                ↺ REPLAY
              </button>

              {/* Speed Selector */}
              <button
                type="button"
                onClick={handleCycleSpeed}
                className="px-2 py-1.5 bg-paper hover:bg-paper-shadow border border-ink/40 text-[10px] text-ink font-bold tracking-wider uppercase cursor-pointer"
              >
                {playbackSpeed}X
              </button>
            </div>

            {/* Traveler Watermark Tag */}
            <div className="text-right text-[8px] text-ink/60 uppercase tracking-widest">
              <div>{passport?.name || 'CITIZEN'} • LTA OFFICIAL</div>
              <div>PASS: {passport?.no || 'LC-0000'}</div>
            </div>
          </div>
        </div>

        {/* 5. SHARE / EXPORT REEL MODAL */}
        {showShareModal && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-paper border-2 border-ink p-4 shadow-2xl relative flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="absolute top-2 right-2 text-ink/60 hover:text-ink text-sm cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-2 border-b border-ink/20 pb-2">
                <Crest className="w-8 h-8 text-[#A57F2C]" />
                <div>
                  <h3 className="font-serif font-bold text-sm text-ink uppercase">
                    EXPEDITION FLIGHT REEL READY
                  </h3>
                  <p className="text-[8px] text-ink/60 tracking-wider uppercase">
                    SOVEREIGN VIDEO TRANSIT RECORD
                  </p>
                </div>
              </div>

              {/* Ticket Card Preview */}
              <div className="bg-[#F7F1E1] border border-ink/30 p-3 flex flex-col gap-2 text-[10px]">
                <div className="flex justify-between items-center text-[9px] text-ink/60">
                  <span>CITIZEN: {(passport?.name || 'TRAVELER').toUpperCase()}</span>
                  <span>NO. {passport?.no || 'LC-0000'}</span>
                </div>
                <div className="font-bold text-xs text-ink">
                  {itinerary.length} COUNTRIES TRAVERSED ({totalJourneyKm.toLocaleString()} KM)
                </div>
                <div className="text-[9px] text-ink/75 leading-relaxed">
                  Route: {itinerary.map((c) => c.iso2).join(' ➔ ')}
                </div>
                <div className="mt-1 pt-1 border-t border-dashed border-ink/20 text-[8px] text-stamp-blue font-bold">
                  ✓ CINEMATIC FLIGHT ANIMATION COMPILED
                </div>
              </div>

              <p className="text-[9px] text-ink/70">
                Direct MP4/WebM video recording and social sharing integrations will be connected here soon. In the meantime, you can copy the official expedition flight manifest:
              </p>

              <button
                type="button"
                onClick={handleCopyShareDetails}
                className="w-full py-2 bg-stamp-blue text-white hover:bg-stamp-blue/90 text-[10px] font-bold tracking-widest uppercase border border-stamp-blue cursor-pointer shadow-sm"
              >
                {copiedShare ? 'COPIED TO CLIPBOARD!' : 'COPY FLIGHT MANIFEST & REEL DETAILS'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
