import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePassport, useVisited, useFinds, useCustomFinds } from '../lib/store'
import { COUNTRIES } from '../data/countries'
import { SEEDED_FINDS } from '../data/finds'
import { COUNTRIES_BY_ISO2, getStampColor } from '../lib/geo'
import { formatStampDate } from './Stamp'
import Crest from './Crest'
import FlightReel from './FlightReel'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFlagEmoji(iso2) {
  if (!iso2 || typeof iso2 !== 'string' || iso2.length !== 2) return '🌐'
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

function getExplorerRank(visitedCount, monumentsCount) {
  const score = visitedCount * 2 + monumentsCount * 3
  if (score >= 25) return { title: 'GRAND SOVEREIGN VOYAGER', level: 5, badge: 'MASTER' }
  if (score >= 15) return { title: 'CONTINENTAL CARTOGRAPHER', level: 4, badge: 'SENIOR' }
  if (score >= 8)  return { title: 'GLOBAL EXPEDITIONARY', level: 3, badge: 'ADEPT' }
  if (score >= 3)  return { title: 'REGIONAL WAYFARER', level: 2, badge: 'JOURNEYMAN' }
  return { title: 'NOVICE TRAVELER', level: 1, badge: 'INITIATE' }
}

export default function ProfileTab() {
  const [passport] = usePassport()
  const [visited] = useVisited()
  const [finds] = useFinds()
  const [customFinds] = useCustomFinds()
  const navigate = useNavigate()

  const [activeSubTab, setActiveSubTab] = useState('monuments') // 'monuments' | 'countries' | 'achievements' | 'activity'
  const [monumentFilter, setMonumentFilter] = useState('all') // 'all' | 'stamped' | 'unvisited'
  const [monumentSearch, setMonumentSearch] = useState('')
  const [copiedToast, setCopiedToast] = useState(false)
  const [showFlightReel, setShowFlightReel] = useState(false)

  // 1. Visited Countries statistics
  const visitedList = useMemo(() => {
    if (!visited) return []
    return Object.entries(visited).map(([iso2, date]) => {
      const country = COUNTRIES_BY_ISO2.get(iso2.toUpperCase())
      return {
        iso2: iso2.toUpperCase(),
        name: country ? country.name : iso2,
        date,
      }
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [visited])

  const visitedCount = visitedList.length
  const totalCountries = COUNTRIES.length // 195
  const worldProgressPercent = ((visitedCount / totalCountries) * 100).toFixed(1)

  // 2. All Seeded Landmarks / Monuments catalogue
  const allCatalogueMonuments = useMemo(() => {
    const list = []
    for (const [cIso, countryFinds] of Object.entries(SEEDED_FINDS)) {
      const countryDef = COUNTRIES_BY_ISO2.get(cIso)
      for (const f of countryFinds) {
        if (f.category === 'landmark') {
          list.push({
            ...f,
            countryName: countryDef ? countryDef.name : cIso,
          })
        }
      }
    }
    return list
  }, [])

  // 3. Stamped Monuments and Category tallies
  const {
    stampedMonuments,
    stampedFoods,
    stampedExperiences,
    stampedSouvenirs,
    rareCount,
    legendaryCount,
    totalFindsCount,
  } = useMemo(() => {
    const stampedM = []
    const stampedF = []
    const stampedE = []
    const stampedS = []
    let rare = 0
    let legendary = 0

    // Build index of all seeded finds
    const allFindsIndex = {}
    for (const countryFinds of Object.values(SEEDED_FINDS)) {
      for (const item of countryFinds) {
        allFindsIndex[item.id] = item
      }
    }

    // Include custom finds
    if (customFinds) {
      for (const cList of Object.values(customFinds)) {
        if (Array.isArray(cList)) {
          for (const item of cList) {
            allFindsIndex[item.id] = item
          }
        }
      }
    }

    if (finds) {
      for (const [id, stampDate] of Object.entries(finds)) {
        const item = allFindsIndex[id] || {
          id,
          title: id,
          category: 'experience',
          rarity: 'common',
        }
        const enriched = { ...item, stampDate }

        if (enriched.rarity === 'rare') rare++
        if (enriched.rarity === 'legendary') legendary++

        if (enriched.category === 'landmark') stampedM.push(enriched)
        else if (enriched.category === 'food') stampedF.push(enriched)
        else if (enriched.category === 'experience') stampedE.push(enriched)
        else if (enriched.category === 'souvenir') stampedS.push(enriched)
      }
    }

    return {
      stampedMonuments: stampedM,
      stampedFoods: stampedF,
      stampedExperiences: stampedE,
      stampedSouvenirs: stampedS,
      rareCount: rare,
      legendaryCount: legendary,
      totalFindsCount: Object.keys(finds || {}).length,
    }
  }, [finds, customFinds])

  const rank = useMemo(() => {
    return getExplorerRank(visitedCount, stampedMonuments.length)
  }, [visitedCount, stampedMonuments.length])

  // Filtered Monuments list for the Monuments sub-tab
  const filteredMonuments = useMemo(() => {
    const q = monumentSearch.toLowerCase().trim()
    return allCatalogueMonuments.filter((m) => {
      const isStamped = Boolean(finds && finds[m.id])
      if (monumentFilter === 'stamped' && !isStamped) return false
      if (monumentFilter === 'unvisited' && isStamped) return false

      if (q) {
        const matchTitle = m.title.toLowerCase().includes(q)
        const matchCountry = (m.countryName || '').toLowerCase().includes(q)
        const matchDesc = (m.description || '').toLowerCase().includes(q)
        return matchTitle || matchCountry || matchDesc
      }
      return true
    })
  }, [allCatalogueMonuments, finds, monumentFilter, monumentSearch])

  // Consular Achievements list
  const achievements = useMemo(() => {
    return [
      {
        id: 'sovereign_citizen',
        title: 'Sovereign Citizen',
        desc: 'Issued an official Layover Passport',
        icon: '📜',
        unlocked: Boolean(passport),
        progress: '1/1',
      },
      {
        id: 'first_crossing',
        title: 'First Crossing',
        desc: 'Stamped your initial destination country',
        icon: '✈️',
        unlocked: visitedCount >= 1,
        progress: `${Math.min(visitedCount, 1)}/1`,
      },
      {
        id: 'wonder_voyager',
        title: 'World Wonder Hunter',
        desc: 'Catalogued your first world monument',
        icon: '🏛️',
        unlocked: stampedMonuments.length >= 1,
        progress: `${Math.min(stampedMonuments.length, 1)}/1`,
      },
      {
        id: 'seven_wonders',
        title: 'Master of Monuments',
        desc: 'Catalogued 3 or more historic landmarks',
        icon: '⛩️',
        unlocked: stampedMonuments.length >= 3,
        progress: `${Math.min(stampedMonuments.length, 3)}/3`,
      },
      {
        id: 'wonder_architect',
        title: 'Grand Antiquarian',
        desc: 'Catalogued 6 or more world monuments',
        icon: '🗿',
        unlocked: stampedMonuments.length >= 6,
        progress: `${Math.min(stampedMonuments.length, 6)}/6`,
      },
      {
        id: 'epicurean',
        title: 'Epicurean Pilgrim',
        desc: 'Discovered 3+ local authentic culinary finds',
        icon: '🍲',
        unlocked: stampedFoods.length >= 3,
        progress: `${Math.min(stampedFoods.length, 3)}/3`,
      },
      {
        id: 'rare_collector',
        title: 'Rare Relic Hunter',
        desc: 'Discovered a Rare or Legendary artifact',
        icon: '💎',
        unlocked: rareCount + legendaryCount >= 1,
        progress: `${Math.min(rareCount + legendaryCount, 1)}/1`,
      },
      {
        id: 'globetrotter',
        title: 'Sovereign Globetrotter',
        desc: 'Explored 5 or more sovereign nations',
        icon: '🌍',
        unlocked: visitedCount >= 5,
        progress: `${Math.min(visitedCount, 5)}/5`,
      },
    ]
  }, [passport, visitedCount, stampedMonuments.length, stampedFoods.length, rareCount, legendaryCount])

  const unlockedAchievementsCount = achievements.filter((a) => a.unlocked).length

  // Copy Dossier Summary
  const handleCopySummary = () => {
    const homeCountry = COUNTRIES_BY_ISO2.get(passport?.home || '')
    const summary = `=== LAYOVER PASSPORT DOSSIER ===
Traveler: ${passport?.name || 'Citizen'}
Passport No: ${passport?.no || 'LC-0000'}
Nationality: ${homeCountry?.name || passport?.home || 'World'} (${passport?.home})
Rank: ${rank.title} (Level ${rank.level})

STATISTICS:
• Countries Visited: ${visitedCount} / ${totalCountries} (${worldProgressPercent}%)
• Monuments & Landmarks Catalogued: ${stampedMonuments.length}
• Total Field Discoveries: ${totalFindsCount}
• Rare & Legendary Relics: ${rareCount + legendaryCount}
• Achievements Unlocked: ${unlockedAchievementsCount} / ${achievements.length}

Verified by Layover Transit Authority
================================`
    navigator.clipboard?.writeText(summary)
    setCopiedToast(true)
    setTimeout(() => setCopiedToast(false), 2400)
  }

  const homeCountry = COUNTRIES_BY_ISO2.get(passport?.home || '')
  const initial = (passport?.name || 'C').charAt(0).toUpperCase()

  return (
    <div className="flex-1 overflow-y-auto bg-paper text-ink flex flex-col font-typewriter selection:bg-paper-shadow relative pb-8">
      {/* Security Dot Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(28,43,75,0.06) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
        aria-hidden="true"
      />

      {/* Guilloche Top Ribbon */}
      <div
        className="h-8 shrink-0 flex items-center justify-between px-3 relative z-10"
        style={{
          background: '#5A1F26',
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 8px)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F2DC8A] animate-pulse" />
          <span className="text-[9px] text-[#F2DC8A] tracking-[0.25em] font-bold uppercase">
            TRAVELER DOSSIER • LTA RECORD
          </span>
        </div>
        <span className="text-[8px] text-[#F2DC8A]/80 tracking-widest uppercase">
          SEC. 84-B
        </span>
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-4 relative z-10">

        {/* 1. TRAVELER PROFILE CARD */}
        <div className="bg-[#F7F1E1] border-2 border-ink/40 p-4 shadow-[0_3px_10px_rgba(28,43,75,0.08)] relative overflow-hidden">
          {/* Subtle Guilloche watermark crest */}
          <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
            <Crest className="w-36 h-36" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start relative z-10">
            {/* Photo / Monogram Badge */}
            <div className="flex flex-row sm:flex-col items-center gap-3 w-full sm:w-auto">
              <div className="relative w-20 h-24 bg-paper-shadow/60 border-2 border-ink/40 flex flex-col items-center justify-center shadow-inner overflow-hidden shrink-0">
                <div className="w-11 h-11 rounded-full bg-paper border border-ink/30 flex items-center justify-center shadow-sm">
                  <span className="font-display font-black text-2xl text-ink">
                    {initial}
                  </span>
                </div>
                <div className="mt-1 text-[8px] tracking-[0.2em] text-ink/60 uppercase font-bold">
                  PHOTOGRAPH
                </div>
                {/* Official stamp diagonal tape */}
                <div className="absolute top-1 -right-6 w-20 bg-stamp-red/80 text-[6px] text-white text-center py-0.5 rotate-45 font-mono tracking-widest shadow-xs">
                  VERIFIED
                </div>
              </div>

              {/* Explorer Rank Pill */}
              <div className="flex-1 sm:w-full flex flex-col items-start sm:items-center">
                <span className="px-2 py-0.5 bg-paper-shadow border border-ink/30 text-[8px] tracking-widest uppercase font-bold text-ink/80 rounded-xs">
                  {rank.badge} • LVL {rank.level}
                </span>
                <span className="text-[9px] text-stamp-blue font-bold tracking-wider uppercase mt-1">
                  {rank.title}
                </span>
              </div>
            </div>

            {/* Profile Identity Details */}
            <div className="flex-1 flex flex-col gap-2 w-full">
              <div className="flex items-start justify-between border-b border-ink/20 pb-2">
                <div>
                  <div className="text-[8px] tracking-[0.2em] text-ink/60 uppercase">
                    SOVEREIGN TRAVELER / NOM DU TITULAIRE
                  </div>
                  <h1 className="text-xl sm:text-2xl font-serif text-ink font-bold leading-tight uppercase tracking-wide">
                    {passport?.name || 'UNKNOWN TRAVELER'}
                  </h1>
                </div>
                <div className="text-right">
                  <div className="text-[8px] tracking-[0.2em] text-ink/60 uppercase">
                    PASSPORT NO.
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-stamp-red tracking-widest">
                    {passport?.no || 'LC-0000'}
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div>
                  <div className="text-[8px] tracking-[0.15em] text-ink/50 uppercase">
                    NATIONALITY
                  </div>
                  <div className="font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm">{getFlagEmoji(passport?.home)}</span>
                    <span className="truncate">{homeCountry ? homeCountry.name : passport?.home || 'Unknown'}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[8px] tracking-[0.15em] text-ink/50 uppercase">
                    ISSUE DATE
                  </div>
                  <div className="font-bold text-ink mt-0.5">
                    {formatStampDate(passport?.issuedAt)}
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <div className="text-[8px] tracking-[0.15em] text-ink/50 uppercase">
                    STATUS
                  </div>
                  <div className="font-bold text-stamp-green flex items-center gap-1 mt-0.5 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-stamp-green inline-block animate-pulse" />
                    TRANSIT CLEARED
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1.5 EXPEDITION FLIGHT REEL BANNER */}
        <button
          type="button"
          onClick={() => setShowFlightReel(true)}
          className="w-full bg-[#5A1F26] text-[#F2DC8A] border-2 border-[#C9A24B] p-3 shadow-md hover:bg-[#6b252d] transition-all cursor-pointer flex items-center justify-between group rounded-xs"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-[#C9A24B]/20 border border-[#C9A24B] flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
              ✈️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm text-[#F2DC8A] tracking-wider uppercase">
                  EXPEDITION FLIGHT REEL
                </span>
                <span className="text-[7px] bg-[#C9A24B] text-ink font-bold px-1.5 py-0.5 rounded-xs uppercase tracking-widest animate-pulse">
                  3D VIDEO
                </span>
              </div>
              <p className="text-[9px] text-[#F2DC8A]/80 tracking-wide mt-0.5">
                Watch 3D airplane navigate globe through your visited countries
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-bold px-2.5 py-1 bg-[#C9A24B] text-ink rounded-xs uppercase tracking-wider group-hover:bg-[#FFF9E6] transition-colors">
              PLAY REEL ▶
            </span>
          </div>
        </button>

        {/* 2. CORE METRICS OVERVIEW (COUNTRIES, MONUMENTS, FINDS, RELICS) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-ink/80 flex items-center gap-1.5">
              <span>EXPLORATION DOSSIER OVERVIEW</span>
            </h2>
            <button
              type="button"
              onClick={handleCopySummary}
              className="text-[9px] text-stamp-blue hover:text-ink tracking-wider uppercase underline underline-offset-2 flex items-center gap-1 cursor-pointer"
            >
              <span>{copiedToast ? 'COPIED TO CLIPBOARD!' : 'COPY REPORT'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* TOTAL COUNTRIES */}
            <div className="bg-[#F7F1E1] border-2 border-ink/30 p-3 shadow-xs flex flex-col justify-between relative group hover:border-ink/60 transition-colors">
              <div className="flex items-start justify-between">
                <span className="text-[9px] tracking-[0.18em] text-ink/60 uppercase font-bold">
                  TOTAL COUNTRIES
                </span>
                <span className="text-base">🌍</span>
              </div>
              <div className="my-1.5 flex items-baseline gap-1.5">
                <span className="font-display font-black text-3xl sm:text-4xl text-ink leading-none">
                  {visitedCount}
                </span>
                <span className="text-[10px] text-ink/60 font-typewriter">
                  / {totalCountries}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-paper-shadow h-2 border border-ink/20 rounded-xs overflow-hidden mt-1">
                <div
                  className="bg-stamp-blue h-full transition-all duration-500"
                  style={{ width: `${Math.max(Number(worldProgressPercent), 2)}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[8px] text-ink/60 tracking-wider">
                <span>GLOBE VISITED</span>
                <span className="font-bold text-stamp-blue">{worldProgressPercent}%</span>
              </div>
            </div>

            {/* TOTAL MONUMENTS & LANDMARKS */}
            <div className="bg-[#F7F1E1] border-2 border-stamp-red/60 p-3 shadow-xs flex flex-col justify-between relative group hover:border-stamp-red transition-colors">
              <div className="flex items-start justify-between">
                <span className="text-[9px] tracking-[0.18em] text-stamp-red uppercase font-bold">
                  TOTAL MONUMENTS
                </span>
                <span className="text-base">🏛️</span>
              </div>
              <div className="my-1.5 flex items-baseline gap-1.5">
                <span className="font-display font-black text-3xl sm:text-4xl text-stamp-red leading-none">
                  {stampedMonuments.length}
                </span>
                <span className="text-[10px] text-ink/60 font-typewriter">
                  / {allCatalogueMonuments.length}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-paper-shadow h-2 border border-ink/20 rounded-xs overflow-hidden mt-1">
                <div
                  className="bg-stamp-red h-full transition-all duration-500"
                  style={{ width: `${Math.max((stampedMonuments.length / allCatalogueMonuments.length) * 100, 2)}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[8px] text-ink/60 tracking-wider">
                <span>WONDERS CATALOGUED</span>
                <span className="font-bold text-stamp-red">
                  {((stampedMonuments.length / allCatalogueMonuments.length) * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* TOTAL FINDS / DISCOVERIES */}
            <div className="bg-[#F7F1E1] border-2 border-ink/30 p-3 shadow-xs flex flex-col justify-between relative group hover:border-ink/60 transition-colors">
              <div className="flex items-start justify-between">
                <span className="text-[9px] tracking-[0.18em] text-ink/60 uppercase font-bold">
                  TOTAL FINDS
                </span>
                <span className="text-base">🧭</span>
              </div>
              <div className="my-1.5 flex items-baseline gap-1.5">
                <span className="font-display font-black text-3xl sm:text-4xl text-ink leading-none">
                  {totalFindsCount}
                </span>
                <span className="text-[9px] text-ink/60 font-typewriter uppercase">
                  DISCOVERIES
                </span>
              </div>
              <div className="text-[8px] text-ink/60 tracking-wider">
                Foods, Crafts & Experiences
              </div>
            </div>

            {/* RARE & LEGENDARY RELICS */}
            <div className="bg-[#F7F1E1] border-2 border-[#C9A24B] p-3 shadow-xs flex flex-col justify-between relative group hover:border-[#A57F2C] transition-colors">
              <div className="flex items-start justify-between">
                <span className="text-[9px] tracking-[0.18em] text-[#8C651F] uppercase font-bold">
                  RARE & LEGENDARY
                </span>
                <span className="text-base">👑</span>
              </div>
              <div className="my-1.5 flex items-baseline gap-1.5">
                <span className="font-display font-black text-3xl sm:text-4xl text-[#8C651F] leading-none">
                  {rareCount + legendaryCount}
                </span>
                <span className="text-[9px] text-ink/60 font-typewriter uppercase">
                  RELICS
                </span>
              </div>
              <div className="flex items-center gap-2 text-[8px] text-ink/70 tracking-wider font-bold">
                <span className="text-stamp-red">★ {rareCount} RARE</span>
                <span className="text-[#A57F2C]">✦ {legendaryCount} LEGEND</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. CATEGORY DISCOVERY BREAKDOWN STRIP */}
        <div className="bg-[#F7F1E1] border border-ink/25 p-3 flex flex-wrap items-center justify-around gap-2 text-center">
          <div className="flex-1 min-w-[70px]">
            <div className="text-base">🏛️</div>
            <div className="font-bold text-xs sm:text-sm text-ink">{stampedMonuments.length}</div>
            <div className="text-[8px] tracking-wider text-ink/60 uppercase">MONUMENTS</div>
          </div>
          <div className="w-[1px] h-8 bg-ink/20" />
          <div className="flex-1 min-w-[70px]">
            <div className="text-base">🍲</div>
            <div className="font-bold text-xs sm:text-sm text-ink">{stampedFoods.length}</div>
            <div className="text-[8px] tracking-wider text-ink/60 uppercase">CUISINE</div>
          </div>
          <div className="w-[1px] h-8 bg-ink/20" />
          <div className="flex-1 min-w-[70px]">
            <div className="text-base">🎭</div>
            <div className="font-bold text-xs sm:text-sm text-ink">{stampedExperiences.length}</div>
            <div className="text-[8px] tracking-wider text-ink/60 uppercase">EXPERIENCES</div>
          </div>
          <div className="w-[1px] h-8 bg-ink/20" />
          <div className="flex-1 min-w-[70px]">
            <div className="text-base">🏺</div>
            <div className="font-bold text-xs sm:text-sm text-ink">{stampedSouvenirs.length}</div>
            <div className="text-[8px] tracking-wider text-ink/60 uppercase">SOUVENIRS</div>
          </div>
        </div>

        {/* 4. INTERACTIVE SUB-TABS */}
        <div className="flex flex-col gap-3">
          {/* Sub Tab Buttons */}
          <div className="flex border-b-2 border-ink/30 gap-1 overflow-x-auto pb-[1px]">
            {[
              { id: 'monuments', label: `MONUMENTS (${stampedMonuments.length}/${allCatalogueMonuments.length})` },
              { id: 'countries', label: `COUNTRIES (${visitedCount})` },
              { id: 'achievements', label: `ACHIEVEMENTS (${unlockedAchievementsCount}/${achievements.length})` },
            ].map((tab) => {
              const active = activeSubTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`py-1.5 px-3 text-[10px] sm:text-xs font-bold tracking-wider uppercase transition-colors shrink-0 cursor-pointer ${
                    active
                      ? 'bg-ink text-paper border-t-2 border-x-2 border-ink'
                      : 'text-ink/70 hover:text-ink hover:bg-paper-shadow/60'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* SUB-TAB 1: MONUMENTS & WONDERS */}
          {activeSubTab === 'monuments' && (
            <div className="flex flex-col gap-3">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                <div className="flex gap-1">
                  {[
                    { id: 'all', label: `ALL (${allCatalogueMonuments.length})` },
                    { id: 'stamped', label: `COLLECTED (${stampedMonuments.length})` },
                    { id: 'unvisited', label: `UNDISCOVERED (${allCatalogueMonuments.length - stampedMonuments.length})` },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setMonumentFilter(f.id)}
                      className={`text-[9px] px-2 py-1 tracking-wider uppercase border border-ink/30 cursor-pointer transition-colors ${
                        monumentFilter === f.id
                          ? 'bg-stamp-blue text-white font-bold border-stamp-blue'
                          : 'bg-paper-shadow/60 text-ink/75 hover:bg-paper-shadow'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={monumentSearch}
                    onChange={(e) => setMonumentSearch(e.target.value)}
                    placeholder="Search monuments..."
                    className="w-full sm:w-44 px-2 py-1 bg-paper border border-ink/30 text-[10px] text-ink focus:outline-hidden focus:border-stamp-blue placeholder:text-ink/40"
                  />
                  {monumentSearch && (
                    <button
                      type="button"
                      onClick={() => setMonumentSearch('')}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink/50 text-[10px] hover:text-ink cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Monuments List */}
              <div className="flex flex-col gap-2">
                {filteredMonuments.length === 0 ? (
                  <div className="p-6 text-center text-ink/60 border border-dashed border-ink/30 text-xs">
                    No monuments matching the current filter.
                  </div>
                ) : (
                  filteredMonuments.map((m) => {
                    const isStamped = Boolean(finds && finds[m.id])
                    const stampDate = isStamped ? finds[m.id] : null
                    const rarityColor =
                      m.rarity === 'legendary'
                        ? 'text-[#A57F2C] border-[#A57F2C] bg-[#A57F2C]/10'
                        : m.rarity === 'rare'
                        ? 'text-stamp-red border-stamp-red bg-stamp-red/10'
                        : 'text-stamp-blue border-stamp-blue bg-stamp-blue/10'

                    return (
                      <div
                        key={m.id}
                        className={`p-3 border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                          isStamped
                            ? 'bg-[#F7F1E1] border-ink/40 shadow-xs'
                            : 'bg-paper-shadow/40 border-ink/20 opacity-85 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 flex-1">
                          {/* Visual Seal Icon */}
                          <div
                            className={`w-9 h-9 rounded-sm border-2 flex items-center justify-center shrink-0 text-base ${
                              isStamped
                                ? 'border-stamp-red text-stamp-red bg-paper'
                                : 'border-ink/20 text-ink/40 bg-paper-shadow/40'
                            }`}
                          >
                            🏛️
                          </div>

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="font-serif font-bold text-sm text-ink leading-tight">
                                {m.title}
                              </h3>
                              <span className={`text-[7px] font-bold px-1.5 py-0.2 rounded-xs uppercase tracking-wider border ${rarityColor}`}>
                                {m.rarity}
                              </span>
                            </div>

                            <p className="text-[10px] text-ink/75 line-clamp-2 mt-0.5 leading-normal">
                              {m.description}
                            </p>

                            <div className="flex items-center gap-2 mt-1.5 text-[9px] text-ink/60 tracking-wider">
                              <span className="flex items-center gap-1 font-bold text-ink/80">
                                {getFlagEmoji(m.country)} {m.countryName || m.country}
                              </span>
                              <span>•</span>
                              {isStamped ? (
                                <span className="text-stamp-green font-bold flex items-center gap-1">
                                  ✓ STAMPED {formatStampDate(stampDate)}
                                </span>
                              ) : (
                                <span className="text-ink/50 italic">
                                  Awaiting discovery
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Link */}
                        <div className="shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-ink/15 sm:pl-2">
                          <Link
                            to={`/country/${m.country.toLowerCase()}`}
                            className={`inline-block w-full sm:w-auto text-center px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase border transition-colors ${
                              isStamped
                                ? 'bg-paper border-ink/30 text-ink hover:bg-paper-shadow'
                                : 'bg-stamp-blue text-white border-stamp-blue hover:bg-stamp-blue/90 shadow-xs'
                            }`}
                          >
                            {isStamped ? 'VIEW DOSSIER →' : 'TRAVEL & STAMP →'}
                          </Link>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: COUNTRIES VISITED LOG */}
          {activeSubTab === 'countries' && (
            <div className="flex flex-col gap-2.5">
              <div className="text-[10px] text-ink/70 tracking-wider">
                Showing {visitedCount} sovereign nations stamped into your Layover Passport:
              </div>

              {visitedList.length === 0 ? (
                <div className="p-6 text-center text-ink/60 border border-dashed border-ink/30 text-xs">
                  No countries stamped yet. Explore the Atlas to stamp your first country!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {visitedList.map(({ iso2, name, date }) => {
                    const countryStampColor = getStampColor(iso2)
                    return (
                      <Link
                        key={iso2}
                        to={`/country/${iso2.toLowerCase()}`}
                        className="p-2.5 bg-[#F7F1E1] border-2 border-ink/30 hover:border-ink transition-colors flex items-center justify-between group shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{getFlagEmoji(iso2)}</span>
                          <div>
                            <div className="font-serif font-bold text-xs text-ink group-hover:text-stamp-blue transition-colors">
                              {name}
                            </div>
                            <div className="text-[8px] text-ink/60 tracking-wider uppercase">
                              ENTRY: {formatStampDate(date)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-2">
                          <span
                            className="text-[10px] font-bold tracking-widest px-1.5 py-0.5 border"
                            style={{ color: countryStampColor, borderColor: countryStampColor }}
                          >
                            {iso2}
                          </span>
                          <span className="text-ink/40 group-hover:text-ink text-xs">→</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}

              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-4 py-1.5 bg-paper-shadow border border-ink/40 text-[10px] font-bold tracking-widest uppercase hover:bg-paper cursor-pointer"
                >
                  DISCOVER NEW NATIONS ON ATLAS →
                </button>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: ACHIEVEMENTS & SEALS */}
          {activeSubTab === 'achievements' && (
            <div className="flex flex-col gap-2">
              <div className="text-[10px] text-ink/70 tracking-wider">
                Consular Diplomatic Commendations ({unlockedAchievementsCount} / {achievements.length} Unlocked):
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`p-3 border-2 flex items-start gap-2.5 ${
                      ach.unlocked
                        ? 'bg-[#F7F1E1] border-ink/40 shadow-xs'
                        : 'bg-paper-shadow/30 border-ink/20 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 text-base ${
                        ach.unlocked
                          ? 'border-stamp-green bg-stamp-green/10'
                          : 'border-ink/20 bg-paper'
                      }`}
                    >
                      {ach.icon}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif font-bold text-xs text-ink">
                          {ach.title}
                        </h3>
                        <span
                          className={`text-[7px] font-bold px-1.5 py-0.5 tracking-wider uppercase border ${
                            ach.unlocked
                              ? 'border-stamp-green text-stamp-green bg-stamp-green/10'
                              : 'border-ink/20 text-ink/40'
                          }`}
                        >
                          {ach.unlocked ? 'UNLOCKED' : ach.progress}
                        </span>
                      </div>
                      <p className="text-[9px] text-ink/70 mt-0.5">
                        {ach.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. QUICK TRAVEL ACTIONS */}
        <div className="pt-2 border-t-2 border-ink/20 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/passport')}
            className="flex-1 min-w-[130px] py-2 px-3 bg-[#F7F1E1] hover:bg-paper border-2 border-ink/30 text-[10px] font-bold tracking-widest uppercase text-ink transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>📖</span>
            <span>VIEW PASSPORT BOOK</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/exchange')}
            className="flex-1 min-w-[130px] py-2 px-3 bg-[#F7F1E1] hover:bg-paper border-2 border-ink/30 text-[10px] font-bold tracking-widest uppercase text-ink transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>🤝</span>
            <span>EXCHANGE CODE</span>
          </button>
        </div>

      </div>

      {/* Flight Journey Reel Modal */}
      {showFlightReel && (
        <FlightReel onClose={() => setShowFlightReel(false)} />
      )}
    </div>
  )
}
