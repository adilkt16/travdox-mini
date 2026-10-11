import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import Globe from 'globe.gl'
import * as THREE from 'three'
import { COUNTRIES } from '../data/countries'
import {
  getCountryForFeature,
  getMissingCountriesWithNoPolygon,
  getStampColor,
  hexToRgba,
} from '../lib/geo'
import { useVisited } from '../lib/store'
import TicketStubSlip from './TicketStubSlip'

export default function AtlasGlobe() {
  const [visited, markVisited] = useVisited()
  const containerRef = useRef(null)
  const globeInstanceRef = useRef(null)

  // GeoJSON & missing countries state
  const [geoJsonFeatures, setGeoJsonFeatures] = useState(null)
  const [missingCountries, setMissingCountries] = useState([])
  const [isLoadingGeoJson, setIsLoadingGeoJson] = useState(true)

  // Selected country for ticket stub slip
  const [selectedCountry, setSelectedCountry] = useState(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // Rotation state
  const [isAutoRotating, setIsAutoRotating] = useState(true)

  // Close search dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('#atlas-search-wrapper')) {
        setIsSearchFocused(false)
      }
    }
    window.addEventListener('pointerdown', handleOutsideClick)
    return () => window.removeEventListener('pointerdown', handleOutsideClick)
  }, [])

  // Store latest visited map in a ref for globe accessor callbacks
  const visitedRef = useRef(visited)
  useEffect(() => {
    visitedRef.current = visited
  }, [visited])

  const visitedCount = useMemo(() => {
    return visited ? Object.keys(visited).length : 0
  }, [visited])

  // Filtered countries for typeahead search
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.trim().toLowerCase()
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.iso2.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [searchQuery])

  // Select a country: flies globe, stops auto-rotate, opens slip
  const handleSelectCountry = useCallback((country) => {
    if (!country) return
    setSelectedCountry(country)
    setSearchQuery('')
    setIsSearchFocused(false)

    if (globeInstanceRef.current) {
      const controls = globeInstanceRef.current.controls()
      if (controls) {
        controls.autoRotate = false
        setIsAutoRotating(false)
      }
      globeInstanceRef.current.pointOfView(
        {
          lat: country.lat,
          lng: country.lng,
          altitude: 1.6,
        },
        1100
      )
    }
  }, [])

  // Toggle rotation button
  const handleToggleRotate = useCallback(() => {
    if (globeInstanceRef.current) {
      const controls = globeInstanceRef.current.controls()
      if (controls) {
        const next = !controls.autoRotate
        controls.autoRotate = next
        setIsAutoRotating(next)
      }
    }
  }, [])

  // Mark country as entered
  const handleMarkVisited = useCallback(
    (iso2) => {
      markVisited(iso2)
    },
    [markVisited]
  )

  // Fetch local GeoJSON once
  useEffect(() => {
    let isCancelled = false
    const geoJsonUrl = `${import.meta.env.BASE_URL}ne_110m.geojson`

    fetch(geoJsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} loading GeoJSON`)
        return res.json()
      })
      .then((data) => {
        if (isCancelled) return
        const features = data.features || []
        setGeoJsonFeatures(features)
        const missing = getMissingCountriesWithNoPolygon(features)
        setMissingCountries(missing)
        setIsLoadingGeoJson(false)
      })
      .catch((err) => {
        console.error('[AtlasGlobe] Failed to load ne_110m.geojson:', err)
        if (!isCancelled) setIsLoadingGeoJson(false)
      })

    return () => {
      isCancelled = true
    }
  }, [])

  // Initialize globe.gl once
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || 390
    const height = container.clientHeight || 520

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Initialize Globe instance
    const globe = Globe()(container)
      .width(width)
      .height(height)
      .backgroundColor('rgba(0,0,0,0)')
      .showAtmosphere(false)
      .showGraticules(true)
      .globeMaterial(
        new THREE.MeshLambertMaterial({
          color: '#BFD0CC', // Pale sea-green ocean
        })
      )
      .polygonCapCurvatureResolution(2) // Lower resolution for smooth mobile performance
      .polygonAltitude(0.005)
      .polygonSideColor(() => 'rgba(0,0,0,0)')
      .polygonStrokeColor(() => '#1C2B4B') // Thin ink-navy outlines
      .pointAltitude(0.006)
      .pointRadius((pt) => {
        const isV = visitedRef.current && visitedRef.current[pt.iso2]
        return isV ? 0.5 : 0.35
      })
      .pointResolution(14)
      .pointColor((pt) => {
        const isV = visitedRef.current && visitedRef.current[pt.iso2]
        return isV ? getStampColor(pt.iso2) : '#1C2B4B'
      })
      .onPolygonClick((feature) => {
        const country = getCountryForFeature(feature)
        if (country) {
          handleSelectCountry(country)
        }
      })
      .onPointClick((point) => {
        if (point && point.iso2) {
          handleSelectCountry(point)
        }
      })
      .onGlobeClick(() => {
        // Tapping ocean dismisses bottom slip
        setSelectedCountry(null)
      })

    // Auto-rotation setup
    const controls = globe.controls()
    if (controls) {
      controls.autoRotate = !prefersReducedMotion
      controls.autoRotateSpeed = 0.32
      controls.enableDamping = true
      controls.dampingFactor = 0.08

      // Stop auto-rotate on touch/drag
      controls.addEventListener('start', () => {
        controls.autoRotate = false
        setIsAutoRotating(false)
      })
    }

    globeInstanceRef.current = globe

    // Stop auto-rotate on pointerdown/touchstart as extra guarantee
    const stopRotate = () => {
      if (controls && controls.autoRotate) {
        controls.autoRotate = false
        setIsAutoRotating(false)
      }
    }
    container.addEventListener('pointerdown', stopRotate)
    container.addEventListener('touchstart', stopRotate, { passive: true })

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect
        if (w > 0 && h > 0 && globeInstanceRef.current) {
          globeInstanceRef.current.width(w)
          globeInstanceRef.current.height(h)
        }
      }
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      container.removeEventListener('pointerdown', stopRotate)
      container.removeEventListener('touchstart', stopRotate)
      if (globeInstanceRef.current) {
        globeInstanceRef.current._destructor()
        globeInstanceRef.current = null
      }
    }
  }, [handleSelectCountry])

  // Feed GeoJSON features and missing points into globe once loaded
  useEffect(() => {
    if (!globeInstanceRef.current || !geoJsonFeatures) return

    globeInstanceRef.current
      .polygonsData(geoJsonFeatures)
      .pointsData(missingCountries)
  }, [geoJsonFeatures, missingCountries])

  // Update polygon colors and points when visited changes (WITHOUT rebuilding globe)
  useEffect(() => {
    if (!globeInstanceRef.current) return

    const capColorAccessor = (feature) => {
      const country = getCountryForFeature(feature)
      if (country && visited && visited[country.iso2]) {
        // Stamp ink color at 85% opacity
        return hexToRgba(getStampColor(country.iso2), 0.85)
      }
      return '#E7DBBE' // Unvisited land paper-tan
    }

    const pointColorAccessor = (pt) => {
      if (visited && visited[pt.iso2]) {
        return getStampColor(pt.iso2)
      }
      return '#1C2B4B'
    }

    const pointRadiusAccessor = (pt) => {
      const isV = visited && visited[pt.iso2]
      return isV ? 0.5 : 0.35
    }

    globeInstanceRef.current.polygonCapColor(capColorAccessor)
    globeInstanceRef.current.pointColor(pointColorAccessor)
    globeInstanceRef.current.pointRadius(pointRadiusAccessor)
  }, [visited])

  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden bg-paper">
      {/* Top Floating Bar: Counter & Controls */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center justify-between gap-2 pointer-events-auto">
          {/* Form field counter */}
          <div
            id="atlas-counter-box"
            className="border-2 border-ink bg-[#FBF7ED] px-3 py-1.5 shadow-sm font-typewriter text-xs text-ink tracking-wider flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-stamp-green shrink-0 animate-pulse" />
            <span className="font-bold">COUNTRIES &nbsp;{visitedCount} / 195</span>
          </div>

          {/* Slow auto-rotate indicator & toggle */}
          <button
            type="button"
            onClick={handleToggleRotate}
            id="btn-toggle-rotate"
            className="min-h-[44px] min-w-[44px] border-2 border-ink bg-[#FBF7ED] hover:bg-paper-light active:scale-95 text-ink text-[10px] font-typewriter px-2.5 py-1 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm tracking-wider uppercase"
            title={isAutoRotating ? 'Pause slow rotation' : 'Resume slow rotation'}
            aria-label="Toggle globe rotation"
          >
            <span>{isAutoRotating ? '⏸ PAUSE' : '▶ ROTATE'}</span>
          </button>
        </div>

        {/* Search Field: "FIND A COUNTRY" with Typeahead */}
        <div id="atlas-search-wrapper" className="relative pointer-events-auto">
          <div className="relative border-2 border-ink bg-[#FBF7ED] shadow-sm flex items-center">
            <span className="pl-3 pr-1 text-ink/60 font-typewriter text-xs select-none">
              ⌕
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="FIND A COUNTRY..."
              id="input-find-country"
              className="w-full min-h-[42px] py-1.5 pr-8 bg-transparent font-typewriter text-xs text-ink placeholder:text-ink/50 uppercase tracking-wider focus:outline-none"
              autoComplete="off"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="min-h-[44px] min-w-[36px] flex items-center justify-center font-typewriter text-xs text-ink/60 hover:text-ink -my-1 cursor-pointer"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Typeahead Dropdown */}
          {isSearchFocused && searchQuery.trim() && filteredCountries.length === 0 && (
            <div
              id="search-results-empty"
              className="absolute top-full left-0 right-0 mt-1 bg-[#FBF7ED] border-2 border-ink shadow-2xl p-3 z-40 font-typewriter text-xs text-ink/70 text-center uppercase tracking-wider"
            >
              NOTHING TO DECLARE
            </div>
          )}

          {isSearchFocused && filteredCountries.length > 0 && (
            <div
              id="search-results-dropdown"
              className="absolute top-full left-0 right-0 mt-1 bg-[#FBF7ED] border-2 border-ink shadow-2xl max-h-56 overflow-y-auto z-40 font-typewriter text-xs divide-y divide-ink/20"
            >
              {filteredCountries.map((c) => {
                const isV = Boolean(visited && visited[c.iso2])
                const stampCol = getStampColor(c.iso2)
                return (
                  <button
                    key={c.iso2}
                    type="button"
                    onClick={() => handleSelectCountry(c)}
                    className="w-full min-h-[44px] px-3 py-2 text-left hover:bg-paper-shadow/40 active:bg-paper-shadow/60 flex items-center justify-between gap-2 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 border border-ink/40 text-[10px] bg-paper-shadow/30 font-bold">
                        {c.iso2}
                      </span>
                      <span className="font-semibold text-ink">{c.name}</span>
                    </div>
                    {isV && (
                      <span
                        className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 border rounded-xs"
                        style={{ borderColor: stampCol, color: stampCol }}
                      >
                        ★ ENTERED
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay for GeoJSON */}
      {isLoadingGeoJson && (
        <div className="absolute inset-0 flex items-center justify-center bg-paper/85 z-10 font-typewriter text-xs text-ink/75 tracking-widest uppercase">
          <div className="flex flex-col items-center gap-2">
            <span className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
            <span>CHECKING RECORDS...</span>
          </div>
        </div>
      )}

      {/* 3D Globe Canvas Container */}
      <div
        ref={containerRef}
        id="atlas-globe-container"
        className="w-full h-full min-h-[460px] flex-1 cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Torn Ticket-Stub Slip when country is selected */}
      {selectedCountry && (
        <TicketStubSlip
          country={selectedCountry}
          isVisited={Boolean(visited && visited[selectedCountry.iso2])}
          visitedDate={visited ? visited[selectedCountry.iso2] : null}
          onMarkVisited={handleMarkVisited}
          onClose={() => setSelectedCountry(null)}
        />
      )}
    </div>
  )
}
