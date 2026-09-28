/**
 * Live weather for Start Farming — Open-Meteo forecast API (no key needed).
 *
 * - Client-side fetch with an in-memory + localStorage cache (30 min).
 * - If the network call fails the UI falls back to the demo forecast and
 *   labels it "Sample" — we never present demo weather as live.
 */
import type { CropInfo } from './cropDb'

export type WeatherDay = { date: string; label: string; hi: number; lo: number; rain: number }

export type LiveWeather = {
  source: 'live' | 'sample'
  provider: string
  fetchedAt: string
  place?: string
  tempC: number
  humidity: number
  rainPct: number
  windKph: number
  days: WeatherDay[]
}

const CACHE_KEY = 'agrismart-weather-cache'
const CACHE_MS = 30 * 60 * 1000
const mem = new Map<string, LiveWeather>()

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function readCache(key: string): LiveWeather | null {
  const hit = mem.get(key)
  if (hit && Date.now() - new Date(hit.fetchedAt).getTime() < CACHE_MS) return hit
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const all = JSON.parse(raw) as Record<string, LiveWeather>
    const hit2 = all[key]
    if (hit2 && Date.now() - new Date(hit2.fetchedAt).getTime() < CACHE_MS) { mem.set(key, hit2); return hit2 }
  } catch { /* ignore */ }
  return null
}

function writeCache(key: string, w: LiveWeather): void {
  mem.set(key, w)
  if (typeof window === 'undefined') return
  try {
    const all = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, LiveWeather>
    all[key] = w
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(all))
  } catch { /* ignore */ }
}

export async function fetchLiveWeather(lat: number, lng: number, place?: string): Promise<LiveWeather> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`
  const cached = readCache(key)
  if (cached) return cached
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&forecast_days=7&timezone=auto`
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(t)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const j = await res.json()
    const days: WeatherDay[] = (j.daily?.time ?? []).slice(0, 7).map((d: string, i: number) => ({
      date: d,
      label: DAY[new Date(`${d}T00:00:00`).getDay()],
      hi: Math.round(j.daily.temperature_2m_max?.[i] ?? 0),
      lo: Math.round(j.daily.temperature_2m_min?.[i] ?? 0),
      rain: Math.round(j.daily.precipitation_probability_max?.[i] ?? 0),
    }))
    const w: LiveWeather = {
      source: 'live',
      provider: 'Open-Meteo',
      fetchedAt: new Date().toISOString(),
      place,
      tempC: Math.round(j.current?.temperature_2m ?? days[0]?.hi ?? 30),
      humidity: Math.round(j.current?.relative_humidity_2m ?? 60),
      rainPct: days[0]?.rain ?? 0,
      windKph: Math.round(j.current?.wind_speed_10m ?? 0),
      days,
    }
    writeCache(key, w)
    return w
  } catch {
    return sampleWeather(place)
  }
}

/** Clearly-labelled fallback when the API is unreachable (offline demos). */
export function sampleWeather(place?: string): LiveWeather {
  return {
    source: 'sample',
    provider: 'AgriSmart demo data',
    fetchedAt: new Date().toISOString(),
    place,
    tempC: 32, humidity: 68, rainPct: 20, windKph: 11,
    days: [32, 33, 31, 30, 32, 34, 33].map((hi, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().slice(0, 10),
      label: DAY[(new Date().getDay() + i) % 7],
      hi, lo: hi - 8, rain: [20, 35, 60, 45, 15, 10, 25][i]!,
    })),
  }
}

export type WeatherAdvice = { icon: string; text: string; level: 'ok' | 'warn' | 'alert' }

/** Stage-aware advice for the chosen crop — rules are transparent, not AI claims. */
export function weatherAdvice(crop: CropInfo, stageName: string, w: LiveWeather): WeatherAdvice[] {
  const out: WeatherAdvice[] = []
  const hot = w.days.filter((d) => d.hi > crop.tempC[1] + 2).length
  const cold = w.days.filter((d) => d.lo < crop.tempC[0] - 2).length
  const wet = w.days.filter((d) => d.rain >= 60).length
  if (w.source === 'sample') out.push({ icon: 'ℹ️', text: 'Showing sample forecast — live weather unavailable right now', level: 'ok' })
  if (hot > 0) out.push({ icon: '🌡️', text: `${hot} day(s) above ${crop.tempC[1]}°C — ${crop.key} can suffer heat stress; irrigate early/late, mulch if possible`, level: hot > 2 ? 'alert' : 'warn' })
  if (cold > 0) out.push({ icon: '🥶', text: `${cold} cool night(s) below ${crop.tempC[0]}°C — slow growth expected`, level: 'warn' })
  if (wet > 0) out.push({ icon: '🌧️', text: `${wet} day(s) with ≥60% rain chance — keep drains clear; delay spraying/fertilizing`, level: wet > 2 ? 'alert' : 'warn' })
  if (w.humidity >= 85) out.push({ icon: '🍄', text: 'High humidity — fungal disease risk; scout leaves (use AI Crop Doctor if spots appear)', level: 'warn' })
  if (crop.water === 'High' && wet === 0 && w.tempC >= 33) out.push({ icon: '💧', text: 'Hot & dry spell ahead — high-water crop: verify borewell/canal schedule now', level: 'warn' })
  if (crop.water === 'Low' && wet >= 3) out.push({ icon: '🌾', text: 'Rain-fed friendly crop but heavy rain expected — ensure field drainage to avoid waterlogging', level: 'warn' })
  if (stageName === 'Harvest' || stageName === 'Harvest Preparation') {
    if (wet > 0) out.push({ icon: '🚜', text: 'Rain chance near harvest — plan picking on dry windows to protect grade', level: 'alert' })
  }
  if (stageName === 'Sowing' && wet > 2) out.push({ icon: '🌱', text: 'Good soil moisture for sowing, but avoid waterlogged beds — check field before seeding', level: 'warn' })
  if (out.length <= 1) out.push({ icon: '✅', text: `Conditions look workable for ${crop.key} this week — follow the farm calendar`, level: 'ok' })
  return out
}
