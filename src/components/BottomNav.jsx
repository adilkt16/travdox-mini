import React from 'react'

/**
 * 3-tab bottom nav:
 * - Tabs: ATLAS, PASSPORT, EXCHANGE
 * - Font: Special Elite (typewriter)
 * - Bookmark-style tabs
 * - Text only, NO icons
 */
export default function BottomNav({ activeTab, onSelectTab }) {
  const tabs = [
    { id: 'atlas', label: 'ATLAS' },
    { id: 'passport', label: 'PASSPORT' },
    { id: 'exchange', label: 'EXCHANGE' },
    { id: 'profile', label: 'PROFILE' },
  ]

  return (
    <nav
      aria-label="Passport Sections"
      className="sticky bottom-0 left-0 right-0 z-40 bg-paper-shadow border-t-2 border-ink shadow-[0_-4px_12px_rgba(28,43,75,0.15)]"
    >
      <div className="max-w-[480px] mx-auto px-1.5 pt-2 pb-1 flex items-end justify-around gap-1 sm:gap-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 min-h-[44px] py-2 px-1 text-center font-typewriter text-[10px] sm:text-xs tracking-[0.12em] sm:tracking-[0.18em] uppercase transition-all duration-150 select-none border-t-2 border-x-2 border-ink rounded-t-md cursor-pointer ${isActive
                  ? 'bg-paper text-ink font-bold -translate-y-1 shadow-[0_-3px_8px_rgba(28,43,75,0.2)] border-b-0 pb-3 z-10'
                  : 'bg-paper-shadow/80 text-ink/75 hover:bg-paper/80 hover:text-ink border-b-2 border-ink/40'
                }`}
            >
              <span className="relative inline-block truncate max-w-full">
                {tab.label}
                {isActive && (
                  <span
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-stamp-blue"
                    aria-hidden="true"
                  />
                )}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
