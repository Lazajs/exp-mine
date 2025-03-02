"use client"

import { useState, useEffect } from "react"

export function useStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  useEffect(() => {
    // Get from local storage by key
    const item = window.localStorage.getItem(key)
    // Parse stored json or if none return initialValue
    if (item) {
      setStoredValue(JSON.parse(item))
    }
  }, [key])

  const setValue = (value: T) => {
    // Save state
    setStoredValue(value)
    // Save to local storage
    window.localStorage.setItem(key, JSON.stringify(value))
  }

  return [storedValue, setValue]
}

