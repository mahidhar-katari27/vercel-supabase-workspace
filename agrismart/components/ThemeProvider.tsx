'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark'
type Ctx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void; ready: boolean }

const ThemeContext = createContext<Ctx | null>(null)
const KEY = 'agrismart-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start null-ish and resolve before paint so there is no theme flash.
  const [theme, setThemeState] = useState<Theme>('light')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let stored: string | null = null
    try { stored = localStorage.getItem(KEY) } catch {}
    const prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial: Theme = stored === 'dark' || stored === 'light' ? stored : prefersDark ? 'dark' : 'light'
    setThemeState(initial)
    document.documentElement.classList.toggle('dark', initial === 'dark')
    document.documentElement.style.colorScheme = initial
    setReady(true)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    document.documentElement.classList.toggle('dark', t === 'dark')
    document.documentElement.style.colorScheme = t
    try { localStorage.setItem(KEY, t) } catch {}
  }, [])

  const toggle = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme])

  const value = useMemo(() => ({ theme, setTheme, toggle, ready }), [theme, setTheme, toggle, ready])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
