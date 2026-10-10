import { useState, useEffect, useCallback } from 'react'

// LocalStorage Keys
export const STORAGE_KEYS = {
  PASSPORT: 'passport',
  VISITED: 'visited',
  FINDS: 'finds',
  CUSTOM_FINDS: 'customFinds',
}

// Custom event for same-tab reactive store updates
const STORE_UPDATE_EVENT = 'layover_store_update'

const notifyUpdate = (key) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORE_UPDATE_EVENT, { detail: { key } }))
  }
}

// Safe storage utilities with try/catch
export function safeGet(key, fallback = null) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback
    }
    const item = window.localStorage.getItem(key)
    if (item === null) return fallback
    return JSON.parse(item)
  } catch (err) {
    console.warn(`[Store] Error reading key "${key}":`, err)
    return fallback
  }
}

export function safeSet(key, value) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false
    }
    window.localStorage.setItem(key, JSON.stringify(value))
    notifyUpdate(key)
    return true
  } catch (err) {
    console.warn(`[Store] Error writing key "${key}":`, err)
    return false
  }
}

export function safeRemove(key) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false
    }
    window.localStorage.removeItem(key)
    notifyUpdate(key)
    return true
  } catch (err) {
    console.warn(`[Store] Error removing key "${key}":`, err)
    return false
  }
}

// Synchronous getters & setters for non-React contexts
export const getPassport = () => safeGet(STORAGE_KEYS.PASSPORT, null)
export const savePassport = (data) => safeSet(STORAGE_KEYS.PASSPORT, data)

export const getVisited = () => safeGet(STORAGE_KEYS.VISITED, {})
export const saveVisited = (data) => safeSet(STORAGE_KEYS.VISITED, data)
export const addVisitedCountry = (iso2, dateString) => {
  const current = getVisited() || {}
  const date = dateString || new Date().toISOString().split('T')[0]
  const updated = { ...current, [iso2.toUpperCase()]: date }
  saveVisited(updated)
  return updated
}

export const getFinds = () => safeGet(STORAGE_KEYS.FINDS, {})
export const saveFinds = (data) => safeSet(STORAGE_KEYS.FINDS, data)
export const addFind = (id, dateString) => {
  const current = getFinds() || {}
  const date = dateString || new Date().toISOString().split('T')[0]
  const updated = { ...current, [id]: date }
  saveFinds(updated)
  return updated
}

export const getCustomFinds = () => safeGet(STORAGE_KEYS.CUSTOM_FINDS, {})
export const saveCustomFinds = (data) => safeSet(STORAGE_KEYS.CUSTOM_FINDS, data)
export const appendCustomFind = (iso2, findItem) => {
  const current = getCustomFinds() || {}
  const key = iso2.toUpperCase()
  const list = current[key] ? [...current[key]] : []
  list.push(findItem)
  const updated = { ...current, [key]: list }
  saveCustomFinds(updated)
  return updated
}

// React Hooks
function useStorageKey(key, fallbackValue) {
  const [value, setValue] = useState(() => safeGet(key, fallbackValue))

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === key) {
        setValue(safeGet(key, fallbackValue))
      }
    }
    const handleCustomUpdate = (e) => {
      if (!e.detail || e.detail.key === key) {
        setValue(safeGet(key, fallbackValue))
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(STORE_UPDATE_EVENT, handleCustomUpdate)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(STORE_UPDATE_EVENT, handleCustomUpdate)
    }
  }, [key, fallbackValue])

  const update = useCallback(
    (nextVal) => {
      const resolved = typeof nextVal === 'function' ? nextVal(safeGet(key, fallbackValue)) : nextVal
      safeSet(key, resolved)
      setValue(resolved)
    },
    [key, fallbackValue]
  )

  return [value, update]
}

/**
 * Hook for user passport data:
 * { name, home, no, issuedAt }
 */
export function usePassport() {
  const [passport, setPassport] = useStorageKey(STORAGE_KEYS.PASSPORT, null)
  return [passport, setPassport]
}

/**
 * Hook for visited countries map:
 * { "IN": "2026-10-11", ... }
 */
export function useVisited() {
  const [visited, setVisited] = useStorageKey(STORAGE_KEYS.VISITED, {})

  const markVisited = useCallback((iso2, dateString) => {
    const date = dateString || new Date().toISOString().split('T')[0]
    setVisited((prev) => ({
      ...(prev || {}),
      [iso2.toUpperCase()]: date,
    }))
  }, [setVisited])

  return [visited, markVisited, setVisited]
}

/**
 * Hook for collected finds:
 * { "IN-halwa": "2026-10-11", ... }
 */
export function useFinds() {
  const [finds, setFinds] = useStorageKey(STORAGE_KEYS.FINDS, {})

  const markFind = useCallback((id, dateString) => {
    const date = dateString || new Date().toISOString().split('T')[0]
    setFinds((prev) => ({
      ...(prev || {}),
      [id]: date,
    }))
  }, [setFinds])

  return [finds, markFind, setFinds]
}

/**
 * Hook for custom user-created finds:
 * { "IN": [{ id, title }] }
 */
export function useCustomFinds() {
  const [customFinds, setCustomFinds] = useStorageKey(STORAGE_KEYS.CUSTOM_FINDS, {})

  const addCustomFind = useCallback((iso2, item) => {
    const key = iso2.toUpperCase()
    setCustomFinds((prev) => {
      const currentMap = prev || {}
      const existingList = currentMap[key] || []
      return {
        ...currentMap,
        [key]: [...existingList, item],
      }
    })
  }, [setCustomFinds])

  return [customFinds, addCustomFind, setCustomFinds]
}
