import React, { useState, useId, useMemo } from 'react'
import COUNTRIES from '../data/countries'

/**
 * Generate a random passport number in format LC-XXXX (e.g. LC-4821)
 */
function generatePassportNumber() {
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `LC-${digits}`
}

/**
 * Issue Page — official passport issuance form.
 * - Passport-form layout, Special Elite (typewriter) font
 * - Fields: NAME and HOME COUNTRY (searchable select)
 * - Auto-generated passport number format: LC-XXXX
 * - ISSUE PASSPORT button
 */
export default function IssuePage({ onIssue, onBackToCover }) {
  const [name, setName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIso, setSelectedIso] = useState('')
  const [isOpenSelect, setIsOpenSelect] = useState(false)
  const [passportNo, setPassportNo] = useState(generatePassportNumber)
  const [error, setError] = useState('')

  const nameInputId = useId()
  const countryInputId = useId()

  const selectedCountry = useMemo(() => {
    return COUNTRIES.find((c) => c.iso2 === selectedIso) || null
  }, [selectedIso])

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return COUNTRIES
    const q = searchQuery.toLowerCase().trim()
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.iso2.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const handleSelectCountry = (country) => {
    setSelectedIso(country.iso2)
    setSearchQuery(country.name)
    setIsOpenSelect(false)
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('PLEASE ENTER TRAVELER NAME')
      return
    }
    if (!selectedCountry) {
      setError('PLEASE SELECT A HOME COUNTRY')
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const passportData = {
      name: name.trim().toUpperCase().slice(0, 20),
      home: selectedCountry.iso2,
      no: passportNo,
      issuedAt: today,
    }

    onIssue(passportData)
  }

  return (
    <div className="w-full min-h-[100dvh] flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-[440px] bg-paper border-2 border-ink shadow-passport rounded-sm p-5 sm:p-7 relative font-typewriter text-ink security-pattern">
        {/* Subtle Watermark Stamp */}
        <div
          className="absolute right-4 top-4 text-ink/[0.07] font-stamp text-7xl font-black pointer-events-none select-none rotate-12"
          aria-hidden="true"
        >
          OFFICIAL
        </div>

        {/* Top Header */}
        <div className="border-b-2 border-ink pb-4 mb-5">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-ink/70">
            <span>FORM LP-01</span>
            <span>SERIES 2026</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-semibold tracking-wide text-ink mt-1">
            Passport Issuance
          </h2>
          <p className="text-xs uppercase tracking-wider text-ink/75 mt-0.5">
            Department of Global Transit & Layover
          </p>
        </div>

        {/* Passport Number Block */}
        <div className="mb-5 p-3 bg-paper-shadow/40 border border-ink/40 flex items-center justify-between">
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-ink/70">
              DOCUMENT NUMBER
            </span>
            <span className="font-typewriter text-xl sm:text-2xl font-bold tracking-widest text-ink">
              {passportNo}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPassportNo(generatePassportNumber())}
            title="Generate new document number"
            className="text-[11px] uppercase tracking-wider px-2.5 py-1.5 border border-ink text-ink hover:bg-ink hover:text-paper transition-colors min-h-[36px]"
          >
            REROLL NO.
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* NAME FIELD */}
          <div>
            <label
              htmlFor={nameInputId}
              className="block text-xs uppercase tracking-widest font-bold text-ink mb-1.5"
            >
              TRAVELER FULL NAME <span className="text-stamp-red">*</span>
            </label>
            <input
              id={nameInputId}
              type="text"
              autoComplete="name"
              maxLength={20}
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              placeholder="E.G. AMELIA EARHART"
              className="w-full bg-paper-light border-2 border-ink px-3 py-2.5 text-sm sm:text-base tracking-wider uppercase text-ink placeholder:text-ink/35 focus:outline-none focus:ring-1 focus:ring-ink"
            />
            <span className="block text-[10px] text-ink/60 mt-1 uppercase">
              MAX 20 CHARACTERS FOR PASSPORT MRZ
            </span>
          </div>

          {/* HOME COUNTRY SEARCHABLE SELECT */}
          <div className="relative">
            <label
              htmlFor={countryInputId}
              className="block text-xs uppercase tracking-widest font-bold text-ink mb-1.5"
            >
              HOME COUNTRY / ORIGIN <span className="text-stamp-red">*</span>
            </label>

            <div className="relative">
              <input
                id={countryInputId}
                type="text"
                autoComplete="off"
                placeholder="TYPE TO SEARCH 195 COUNTRIES..."
                value={searchQuery}
                onFocus={() => setIsOpenSelect(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedIso('')
                  setIsOpenSelect(true)
                  setError('')
                }}
                className="w-full bg-paper-light border-2 border-ink px-3 py-2.5 text-sm sm:text-base tracking-wide uppercase text-ink placeholder:text-ink/35 focus:outline-none focus:ring-1 focus:ring-ink pr-10"
              />
              <button
                type="button"
                onClick={() => setIsOpenSelect(!isOpenSelect)}
                aria-label="Toggle country list"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs uppercase px-2 py-1 text-ink/70 hover:text-ink min-h-[36px] flex items-center"
              >
                {isOpenSelect ? '▲' : '▼'}
              </button>
            </div>

            {/* Selected confirmation badge */}
            {selectedCountry && (
              <div className="mt-1.5 inline-flex items-center gap-2 px-2.5 py-1 bg-stamp-blue/10 border border-stamp-blue text-stamp-blue text-xs tracking-wider">
                <span className="font-bold">ORIGIN CONFIRMED:</span>
                <span>{selectedCountry.name} ({selectedCountry.iso2})</span>
              </div>
            )}

            {/* Search Dropdown */}
            {isOpenSelect && (
              <div
                className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-paper border-2 border-ink shadow-xl z-30"
                tabIndex={-1}
              >
                {filteredCountries.length === 0 ? (
                  <div className="p-3 text-xs text-ink/60 uppercase">
                    NO MATCHING COUNTRY FOUND
                  </div>
                ) : (
                  filteredCountries.map((c) => {
                    const isSelected = c.iso2 === selectedIso
                    return (
                      <button
                        key={c.iso2}
                        type="button"
                        onClick={() => handleSelectCountry(c)}
                        className={`w-full text-left px-3 py-2.5 text-xs sm:text-sm border-b border-ink/15 flex items-center justify-between transition-colors min-h-[44px] ${
                          isSelected
                            ? 'bg-ink text-paper font-bold'
                            : 'hover:bg-paper-shadow text-ink'
                        }`}
                      >
                        <span className="uppercase">{c.name}</span>
                        <span className="opacity-75 font-mono text-[11px]">
                          [{c.iso2}]
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Validation Error Banner */}
          {error && (
            <div
              role="alert"
              className="p-2.5 border border-stamp-red bg-stamp-red/10 text-stamp-red text-xs uppercase tracking-wide flex items-center gap-2"
            >
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Notice */}
          <div className="text-[11px] text-ink/75 border-l-2 border-ink/40 pl-2.5 py-1 leading-relaxed">
            NOTICE: UPON ISSUANCE, YOUR HOME COUNTRY WILL AUTOMATICALLY RECEIVE YOUR FIRST COMMEMORATIVE ENTRY STAMP.
          </div>

          {/* ISSUE BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[48px] bg-ink text-paper font-typewriter text-sm sm:text-base font-bold tracking-[0.2em] uppercase py-3 px-6 border-2 border-ink shadow-md hover:bg-ink-light active:translate-y-0.5 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>ISSUE PASSPORT</span>
              <span className="text-gold-light">★</span>
            </button>
          </div>

          {/* Optional return to closed cover */}
          {onBackToCover && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onBackToCover}
                className="text-[11px] text-ink/60 hover:text-ink underline uppercase tracking-wider min-h-[44px]"
              >
                Close Passport Cover
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
