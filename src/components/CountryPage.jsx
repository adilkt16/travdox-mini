import React, { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { COUNTRIES_BY_ISO2, getStampColor } from '../lib/geo'
import { useVisited, useFinds, useCustomFinds } from '../lib/store'
import { getFindsForCountry, hasSeededFinds } from '../data/finds'
import HoldToStamp from './HoldToStamp'
import Stamp from './Stamp'

/**
 * /country/:iso page:
 * - Header like a passport form: COUNTRY and DATE OF ENTRY in Special Elite
 * - Entry stamp area (uses <HoldToStamp>)
 * - Finds as ruled rows (not cards): title, one-line description, rarity ink color, <HoldToStamp> target
 * - Collected finds show their <Stamp>
 * - Seeded finds for 12 countries, custom finds for others with "ADD YOUR OWN FIND"
 */
export default function CountryPage({ passport }) {
  const { iso } = useParams()
  const iso2 = (iso || '').toUpperCase()

  const [visited, markVisited] = useVisited()
  const [finds, markFind] = useFinds()
  const [customFinds, addCustomFind] = useCustomFinds()

  const [newFindTitle, setNewFindTitle] = useState('')
  const [isAddingFind, setIsAddingFind] = useState(false)

  // Find country definition
  const country = useMemo(() => {
    return (
      COUNTRIES_BY_ISO2.get(iso2) || {
        iso2,
        name: `Territory ${iso2}`,
        lat: 0,
        lng: 0,
      }
    )
  }, [iso2])

  const stampColor = useMemo(() => getStampColor(iso2), [iso2])
  const isVisited = Boolean(visited && visited[iso2])
  const visitedDate = isVisited ? visited[iso2] : null

  // Seeded finds
  const seededList = useMemo(() => getFindsForCountry(iso2), [iso2])
  const countryHasSeeded = hasSeededFinds(iso2)

  // Custom user finds for this country
  const userCustomList = useMemo(() => {
    if (!customFinds || !customFinds[iso2]) return []
    return customFinds[iso2]
  }, [customFinds, iso2])

  // Combine seeded + custom
  const allFinds = useMemo(() => {
    return [...seededList, ...userCustomList]
  }, [seededList, userCustomList])

  // Count collected finds
  const collectedCount = useMemo(() => {
    if (!finds) return 0
    return allFinds.filter((f) => Boolean(finds[f.id])).length
  }, [allFinds, finds])

  const handleCreateCustomFind = (e) => {
    e.preventDefault()
    const trimmed = newFindTitle.trim()
    if (!trimmed) return

    const newId = `${iso2}-custom-${Date.now()}`
    const item = {
      id: newId,
      country: iso2,
      title: trimmed,
      description: 'Personal field discovery catalogued by traveler',
      category: 'experience',
      rarity: 'common',
    }

    addCustomFind(iso2, item)
    setNewFindTitle('')
    setIsAddingFind(false)
  }

  const handleStampEntry = () => {
    markVisited(iso2)
  }

  const handleStampFind = (findId) => {
    markFind(findId)
    // If not yet visited, stamping a find in that country automatically enters it
    if (!isVisited) {
      markVisited(iso2)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-paper text-ink flex flex-col font-typewriter selection:bg-paper-shadow">
      {/* Top Consular Navigation Bar */}
      <header className="px-4 py-2.5 bg-paper-shadow/50 border-b border-ink/25 flex items-center justify-between text-xs tracking-wider uppercase shrink-0">
        <Link
          to="/"
          id="btn-back-atlas"
          className="min-h-[44px] inline-flex items-center gap-1.5 font-bold hover:text-ink/80 transition-colors cursor-pointer"
        >
          <span className="text-sm">←</span>
          <span>ATLAS GLOBE</span>
        </Link>
        <div className="text-[10px] text-ink/70">
          <span>TERRITORY // {iso2}</span>
        </div>
      </header>

      {/* Main Visa Form Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col gap-5">
        {/* Passport Form Header (Special Elite) */}
        <section
          className="border-2 border-ink bg-paper-light/70 p-4 shadow-sm relative overflow-hidden"
          aria-labelledby="form-header-title"
        >
          {/* Security Guilloche corner styling */}
          <div className="absolute top-1 right-1 text-[8px] opacity-40 font-mono tracking-widest pointer-events-none">
            [FORM CP-195]
          </div>

          <div className="border-b border-dashed border-ink/30 pb-2 mb-3">
            <div className="text-[10px] tracking-widest text-ink/65 uppercase">
              IMMIGRATION & NATURALIZATION SERVICE • VISITATION RECORD
            </div>
          </div>

          {/* Form Fields: COUNTRY and DATE OF ENTRY in Special Elite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="border-b border-ink/40 pb-1">
              <span className="text-[10px] tracking-widest text-ink/60 uppercase block">
                COUNTRY
              </span>
              <h1
                id="form-header-title"
                className="font-heading text-2xl sm:text-3xl font-bold text-ink leading-tight"
              >
                {country.name}
              </h1>
            </div>

            <div className="border-b border-ink/40 pb-1">
              <span className="text-[10px] tracking-widest text-ink/60 uppercase block">
                DATE OF ENTRY
              </span>
              <div className="font-bold text-sm sm:text-base tracking-wider text-ink flex items-center gap-2 mt-0.5 whitespace-nowrap">
                {isVisited ? (
                  <>
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: stampColor }}
                    />
                    <span>{visitedDate}</span>
                    <span className="text-[10px] px-1.5 py-0.5 border border-ink/30 bg-paper-shadow/40 rounded-xs uppercase">
                      VALIDATED
                    </span>
                  </>
                ) : (
                  <span className="text-ink/60 italic font-normal text-xs sm:text-sm">
                    NOT YET ENTERED • VISA PENDING
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sub data row */}
          <div className="mt-3 pt-2 text-[10px] text-ink/65 flex flex-wrap items-center justify-between gap-2 uppercase tracking-wider">
            <div>
              COORDINATES: {country.lat.toFixed(2)}°N, {country.lng.toFixed(2)}°E
            </div>
            <div>
              STATUS:{' '}
              <strong className={isVisited ? 'text-ink font-bold' : 'text-ink/60 font-normal'}>
                {isVisited ? 'ENTRY ADMITTED' : 'UNSTAMPED'}
              </strong>
            </div>
          </div>
        </section>

        {/* 2. Official Entry Stamp Area (Uses <HoldToStamp>) */}
        <section
          className="border-2 border-dashed border-ink/35 bg-[#FBF7ED] p-4 relative text-center rounded-xs"
          aria-label="Official Entry Stamp Area"
        >
          <div className="text-[10px] tracking-widest uppercase text-ink/60 font-bold mb-3 flex items-center justify-center gap-2">
            <span>— PORT OF ENTRY IMMIGRATION STAMP —</span>
          </div>

          <div className="min-h-[160px] flex flex-col items-center justify-center py-2">
            {isVisited ? (
              <div className="flex flex-col items-center">
                <Stamp
                  id={`entry-${iso2}`}
                  title={country.name}
                  subtitle="PORT OF ENTRY"
                  date={visitedDate}
                  color={stampColor}
                  size={155}
                  rarity="common"
                />
                <div className="mt-2 text-[10px] tracking-widest uppercase text-ink/75 font-semibold">
                  ENTRY RECORDED ON {visitedDate}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs text-ink/75 max-w-[320px] leading-relaxed">
                  Hold the stamp down to apply your sovereign entry visa to this territory.
                </p>
                <HoldToStamp
                  id={`entry-${iso2}`}
                  title={country.name}
                  subtitle="PORT OF ENTRY"
                  color={stampColor}
                  onStamp={handleStampEntry}
                  label="HOLD TO STAMP ENTRY VISA"
                  stampSize={155}
                  buttonClassName="px-6 py-3 text-xs bg-[#E7DBBE] border-2 border-ink shadow-sm font-bold tracking-widest"
                />
              </div>
            )}
          </div>
        </section>

        {/* 3. Authentic Finds as Ruled Rows (NOT cards) */}
        <section className="flex flex-col gap-2 mt-2" aria-labelledby="finds-section-title">
          {/* Section header */}
          <div className="flex items-center justify-between border-b-2 border-ink pb-1.5 text-xs tracking-wider uppercase">
            <h2 id="finds-section-title" className="font-bold text-ink flex items-center gap-2">
              <span>LOCAL DISCOVERIES</span>
              <span className="text-[10px] font-normal text-ink/70">
                ({collectedCount} / {allFinds.length} STAMPED)
              </span>
            </h2>
            <div className="text-[10px] text-ink/60">
              HONOR SYSTEM // HOLD 600MS
            </div>
          </div>

          {/* If No Seeded Finds for this country */}
          {!countryHasSeeded && userCustomList.length === 0 && (
            <div className="py-6 px-4 text-center border-b border-ink/20">
              <p className="text-xs text-ink/70 uppercase tracking-widest mb-1">
                NO FINDS CATALOGUED YET.
              </p>
              <p className="text-[11px] text-ink/55 font-serif italic max-w-[340px] mx-auto">
                This territory does not yet have official embassy records. Add your own discovery below.
              </p>
            </div>
          )}

          {/* Ruled Rows Container */}
          <div className="divide-y divide-ink/20 border-b border-ink/20 passport-ruled">
            {allFinds.map((find, idx) => {
              const isCollected = Boolean(finds && finds[find.id])
              const collectedDate = isCollected ? finds[find.id] : null

              // Ink color indicator by rarity
              let rarityColor = '#2A4B9B' // common
              if (find.rarity === 'rare') rarityColor = '#B23A2B'
              else if (find.rarity === 'legendary') rarityColor = '#C9A24B'

              return (
                <div
                  key={find.id || idx}
                  className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[58px]"
                >
                  {/* Left & Middle: Title, Description, Category, Rarity */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
                      {/* Rarity Ink Pip */}
                      <span
                        className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${
                          find.rarity === 'legendary' ? 'animate-shimmer-slow' : ''
                        }`}
                        style={{ backgroundColor: rarityColor }}
                        title={`${find.rarity} rarity`}
                      />

                      {/* Title in vintage serif */}
                      <span className="font-heading text-lg font-bold text-ink leading-tight">
                        {find.title}
                      </span>

                      {/* Category tag */}
                      <span className="text-[9px] uppercase px-1.5 py-0.2 border border-ink/30 text-ink/60 font-typewriter shrink-0">
                        {find.category || 'FIND'}
                      </span>

                      {/* Rarity text */}
                      {find.rarity !== 'common' && (
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider shrink-0"
                          style={{ color: rarityColor }}
                        >
                          [{find.rarity}]
                        </span>
                      )}
                    </div>

                    {/* One-line Description */}
                    <p className="font-serif text-xs text-ink/80 leading-snug line-clamp-2 sm:line-clamp-1 ml-4.5">
                      {find.description}
                    </p>
                  </div>

                  {/* Right: Collected Stamp or HoldToStamp Button */}
                  <div className="shrink-0 flex items-center justify-end">
                    {isCollected ? (
                      <div className="flex items-center gap-2">
                        <Stamp
                          id={find.id}
                          title={find.title}
                          subtitle={find.category}
                          rarity={find.rarity}
                          date={collectedDate}
                          size={76}
                          showOverstamp={true}
                        />
                      </div>
                    ) : (
                      <HoldToStamp
                        id={find.id}
                        title={find.title}
                        subtitle={find.category}
                        rarity={find.rarity}
                        onStamp={() => handleStampFind(find.id)}
                        label="HOLD TO STAMP"
                        stampSize={76}
                        buttonClassName="text-[11px] py-1.5 px-3 min-h-[44px]"
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ADD YOUR OWN FIND Row (Requirement 6) */}
          <div className="pt-3">
            {!isAddingFind ? (
              <button
                type="button"
                onClick={() => setIsAddingFind(true)}
                id="btn-add-find-open"
                className="w-full min-h-[44px] py-2.5 px-3 border border-dashed border-ink/50 hover:border-ink hover:bg-paper-light text-ink/80 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>+ ADD YOUR OWN FIND</span>
                <span className="text-[10px] text-ink/60 font-normal">
                  (Common field discovery)
                </span>
              </button>
            ) : (
              <form
                onSubmit={handleCreateCustomFind}
                className="p-3 border-2 border-ink bg-paper-light/90 flex flex-col gap-2.5"
              >
                <div className="text-[10px] uppercase font-bold text-ink/75 tracking-wider">
                  RECORD NEW CUSTOM DISCOVERY // TERRITORY {iso2}
                </div>
                <input
                  type="text"
                  value={newFindTitle}
                  onChange={(e) => setNewFindTitle(e.target.value)}
                  placeholder="Enter discovery title (e.g. Hidden tea stall by harbour...)"
                  className="w-full min-h-[44px] px-3 py-2 bg-paper text-ink border border-ink text-xs font-typewriter focus:outline-none focus:ring-1 focus:ring-ink"
                  autoFocus
                  required
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingFind(false)
                      setNewFindTitle('')
                    }}
                    className="min-h-[44px] px-3 py-1.5 border border-ink/40 text-xs uppercase text-ink/70 hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-custom-find"
                    className="min-h-[44px] px-4 py-1.5 border-2 border-ink bg-stamp-blue text-paper-light font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer"
                  >
                    CATALOGUE FIND
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Footer Immigration Seal */}
        <footer className="text-center pt-3 pb-4 text-[10px] text-ink/50 tracking-widest uppercase border-t border-ink/20 mt-auto">
          OFFICIAL CONSULAR RECORD // {country.iso2} ENTRY PERMIT
        </footer>
      </div>
    </div>
  )
}
