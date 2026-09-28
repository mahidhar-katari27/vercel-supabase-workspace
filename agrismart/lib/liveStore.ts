'use client'

/**
 * Live persistence for bookings with a graceful chain:
 *
 *   Supabase `bookings` table  →  localStorage mirror  →  demo dataset
 *
 * Before supabase/migrations/0001_core.sql is applied the table does not
 * exist, so everything lands in localStorage and the UI says so honestly.
 * The moment the table exists, the same code paths write to Postgres — no
 * redeploy needed.
 */
import { supabaseBrowser, isMissingTable } from './supabase'
import type { Booking } from './data'

const LS_KEY = 'agrismart-local-bookings'

export type BookingSource = 'live' | 'local' | 'none'

function readLocal(): Booking[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(window.localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}

function writeLocal(rows: Booking[]) {
  try { window.localStorage.setItem(LS_KEY, JSON.stringify(rows.slice(0, 50))) } catch { /* private mode */ }
}

/** Is the real Postgres table there yet? Cached per session. */
let tableKnown: boolean | null = null
export async function bookingsTableExists(force = false): Promise<boolean> {
  if (tableKnown !== null && !force) return tableKnown
  const sb = supabaseBrowser()
  if (!sb) { tableKnown = false; return false }
  const { error } = await sb.from('bookings').select('id').limit(1)
  tableKnown = !error || !isMissingTable(error)
  return tableKnown
}

/** Bookings saved by this browser (Supabase first, local mirror included). */
export async function loadStoredBookings(): Promise<{ rows: Booking[]; source: BookingSource }> {
  const local = readLocal()
  const sb = supabaseBrowser()
  if (sb && (await bookingsTableExists())) {
    const { data, error } = await sb
      .from('bookings')
      .select('id, service, icon, provider, date, time, status, amount, land, driver')
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error && data) {
      const rows = data.map((r) => ({ ...r, icon: r.icon ?? '🚜' })) as Booking[]
      // union with the local mirror so nothing ever disappears from the UI
      const ids = new Set(rows.map((r) => r.id))
      return { rows: [...rows, ...local.filter((l) => !ids.has(l.id))], source: 'live' }
    }
  }
  return { rows: local, source: local.length ? 'local' : 'none' }
}

/** Persist a new booking. Returns where it actually landed. */
export async function addBooking(b: Booking): Promise<BookingSource> {
  writeLocal([b, ...readLocal()])
  const sb = supabaseBrowser()
  if (sb && (await bookingsTableExists())) {
    const { error } = await sb.from('bookings').insert({
      id: b.id, service: b.service, icon: b.icon, provider: b.provider,
      date: b.date, time: b.time, status: b.status, amount: b.amount,
      land: b.land ?? null, driver: b.driver ?? false,
    })
    if (!error) return 'live'
  }
  return 'local'
}

/** Best-effort status sync (cancel flow). */
export async function updateBookingStatus(id: string, status: Booking['status']): Promise<void> {
  writeLocal(readLocal().map((b) => (b.id === id ? { ...b, status } : b)))
  const sb = supabaseBrowser()
  if (sb && (await bookingsTableExists())) {
    await sb.from('bookings').update({ status }).eq('id', id)
  }
}
