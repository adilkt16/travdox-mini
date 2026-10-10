import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { COUNTRIES_BY_ISO2, getStampColor } from '../lib/geo'
import { useVisited } from '../lib/store'

export default function CountryPagePlaceholder() {
  const { iso } = useParams()
  const [visited, markVisited] = useVisited()
  const iso2 = (iso || '').toUpperCase()
  const country = COUNTRIES_BY_ISO2.get(iso2) || {
    iso2,
    name: `Territory ${iso2}`,
    lat: 0,
    lng: 0,
  }

  const isVisited = Boolean(visited && visited[iso2])
  const stampColor = getStampColor(iso2)
  const entryDate = isVisited ? visited[iso2] : null

  return (
    <div className="flex-1 p-5 flex flex-col justify-between font-typewriter">
      <div>
        {/* Top Navigation */}
        <div className="flex items-center justify-between text-[11px] text-ink/70 border-b border-ink/30 pb-2 mb-4 tracking-widest uppercase">
          <Link
            to="/"
            className="hover:text-ink font-bold min-h-[44px] flex items-center"
          >
            ← BACK TO ATLAS
          </Link>
          <span>ISO: {iso2}</span>
        </div>

        {/* Dossier Header */}
        <div className="border-2 border-ink bg-paper-light p-4 mb-4 shadow-sm relative overflow-hidden">
          <div className="text-[10px] tracking-widest text-ink/70 uppercase mb-1">
            SOVEREIGN TERRITORY DOSSIER
          </div>
          <h2 className="font-heading text-3xl font-bold text-ink leading-tight mb-1">
            {country.name}
          </h2>
          <div className="text-xs text-ink/70 uppercase tracking-wider">
            COORDINATES: {country.lat.toFixed(2)}°N, {country.lng.toFixed(2)}°E
          </div>

          {/* Status Badge */}
          <div className="mt-4 pt-3 border-t border-dashed border-ink/30 flex items-center justify-between">
            <span className="text-xs text-ink/80 font-bold uppercase tracking-wider">
              VISIT STATUS:
            </span>
            {isVisited ? (
              <span
                className="px-2 py-0.5 border text-xs font-bold uppercase tracking-wider rounded-xs"
                style={{ borderColor: stampColor, color: stampColor }}
              >
                ★ ENTERED ({entryDate})
              </span>
            ) : (
              <span className="px-2 py-0.5 border border-ink/40 text-xs text-ink/60 uppercase tracking-wider">
                NOT YET VISITED
              </span>
            )}
          </div>
        </div>

        {/* Stamping Section Notice */}
        <div className="border border-dashed border-ink/40 p-4 text-center bg-paper-shadow/30 rounded-xs mb-4">
          <p className="text-xs uppercase font-bold text-ink mb-1">
            ENTRY VISA & FINDS CATALOGUE
          </p>
          <p className="text-[11px] text-ink/70 leading-relaxed mb-3">
            Full stamp interaction with hold-to-stamp press and local finds will be active in the next phase.
          </p>

          {!isVisited && (
            <button
              type="button"
              onClick={() => markVisited(iso2)}
              className="min-h-[44px] px-4 py-2 border-2 border-ink bg-stamp-green text-paper-light font-bold text-xs uppercase tracking-wider cursor-pointer hover:brightness-110 active:scale-95 transition"
            >
              ✦ MARK AS ENTERED
            </button>
          )}
        </div>
      </div>

      <div className="text-center pt-4 pb-2 text-[10px] text-ink/50 tracking-widest uppercase">
        PASSPORT IMMIGRATION CONTROL // SECTION 03
      </div>
    </div>
  )
}
