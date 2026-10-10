import React, { useState } from 'react'
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { usePassport, useVisited, useFinds } from './lib/store'
import PassportCover from './components/PassportCover'
import IssuePage from './components/IssuePage'
import BottomNav from './components/BottomNav'
import AtlasGlobe from './components/AtlasGlobe'
import CountryPagePlaceholder from './components/CountryPagePlaceholder'
import PassportPlaceholder from './components/PassportPlaceholder'
import ExchangePlaceholder from './components/ExchangePlaceholder'

function AppContent() {
  const [passport, setPassport] = usePassport()
  const [visited, markVisited] = useVisited()
  const [finds] = useFinds()
  const [hasOpenedCover, setHasOpenedCover] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  // Derive current tab from route
  const getActiveTab = () => {
    const path = location.pathname.toLowerCase()
    if (path.includes('passport')) return 'passport'
    if (path.includes('exchange')) return 'exchange'
    return 'atlas'
  }

  const activeTab = getActiveTab()

  const handleSelectTab = (tabId) => {
    if (tabId === 'atlas') navigate('/')
    else if (tabId === 'passport') navigate('/passport')
    else if (tabId === 'exchange') navigate('/exchange')
  }

  const handleIssuePassport = (passportData) => {
    // 1. Save passport data in localStorage
    setPassport(passportData)
    // 2. Auto-stamp home country into visited
    markVisited(passportData.home, passportData.issuedAt)
    // 3. Navigate to atlas home tab
    navigate('/')
  }

  const handleResetPassport = () => {
    if (window.confirm('Reset this passport and return to closed cover?')) {
      setPassport(null)
      setHasOpenedCover(false)
      navigate('/')
    }
  }

  const visitedCount = visited ? Object.keys(visited).length : 0
  const findsCount = finds ? Object.keys(finds).length : 0

  // 1. If passport not yet issued, show Onboarding Flow (Cover -> Issue Page)
  if (!passport) {
    return (
      <main className="w-full min-h-[100dvh] flex items-center justify-center bg-[#E4D7B8] p-0 sm:p-4">
        <div className="w-full max-w-[480px] min-h-[100dvh] bg-paper shadow-2xl flex flex-col justify-center relative overflow-hidden">
          {!hasOpenedCover ? (
            <PassportCover onOpen={() => setHasOpenedCover(true)} />
          ) : (
            <IssuePage
              onIssue={handleIssuePassport}
              onBackToCover={() => setHasOpenedCover(false)}
            />
          )}
        </div>
      </main>
    )
  }

  // 2. Main 3-Tab Shell (Desktop: centered 480px column, Mobile first at 390px)
  return (
    <main className="w-full min-h-[100dvh] flex justify-center bg-[#E4D7B8] p-0 sm:p-4">
      <div className="w-full max-w-[480px] min-h-[100dvh] bg-paper text-ink shadow-passport flex flex-col justify-between relative border-x border-ink/20">
        {/* Top Minimal Sovereign Bar */}
        <header className="px-4 py-2 bg-paper-shadow/60 border-b border-ink/20 flex items-center justify-between text-[11px] font-typewriter text-ink/75 uppercase tracking-wider shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-stamp-green inline-block" />
            <span className="font-bold text-ink">LAYOVER PASSPORT</span>
          </div>
          <div>
            <span>NO. {passport.no}</span>
          </div>
        </header>

        {/* Routed Page Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Routes>
            <Route
              path="/"
              element={<AtlasGlobe passport={passport} />}
            />
            <Route
              path="/atlas"
              element={<AtlasGlobe passport={passport} />}
            />
            <Route
              path="/country/:iso"
              element={<CountryPagePlaceholder passport={passport} />}
            />
            <Route
              path="/passport"
              element={
                <div className="flex-1 flex flex-col overflow-y-auto">
                  <PassportPlaceholder
                    passport={passport}
                    visitedCount={visitedCount}
                    findsCount={findsCount}
                  />
                </div>
              }
            />
            <Route
              path="/exchange"
              element={
                <div className="flex-1 flex flex-col overflow-y-auto">
                  <ExchangePlaceholder
                    passport={passport}
                    visitedCount={visitedCount}
                    onResetPassport={handleResetPassport}
                  />
                </div>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* 3-Tab Bottom Bookmark Navigation */}
        <BottomNav activeTab={activeTab} onSelectTab={handleSelectTab} />
      </div>
    </main>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  )
}
