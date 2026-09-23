'use client'

import { Modal, Chip } from '@/components/ui'

/**
 * In-app setup guide shown by every "Configure Maps" button (spec §1, §19).
 * Mirrors docs/google-maps.md so a demo judge can wire a key in minutes.
 */
export default function MapConfigureModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="🗺️ Configure Google Maps" wide>
      <div className="space-y-4 text-sm text-ink">
        <p className="rounded-2xl border border-gold-400/40 bg-gold-400/10 px-4 py-3 text-[13px] leading-relaxed">
          AgriSmart is currently running in <b>demo map mode</b> with clearly labelled sample
          locations. Add one environment variable to switch every map, search box and
          directions panel to the live Google Maps Platform.
        </p>

        <ol className="space-y-3">
          <Step n={1} title="Create a key">
            Google Cloud Console → <b>APIs &amp; Services → Credentials → Create credentials →
            API key</b>. Project billing must be enabled (Maps includes a monthly free credit).
          </Step>
          <Step n={2} title="Enable exactly these APIs">
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Chip tone="ok">Maps JavaScript API</Chip>
              <Chip tone="ok">Places API</Chip>
              <Chip tone="ok">Geocoding API</Chip>
            </div>
            <p className="mt-1.5 text-[12px] text-muted">
              Directions are drawn by the JavaScript API's DirectionsService; the
              "Open in Google Maps" link needs no API at all.
            </p>
          </Step>
          <Step n={3} title="Add the environment variable">
            <pre className="mt-1.5 overflow-x-auto rounded-2xl bg-ink px-4 py-3 font-mono text-[12px] text-leaf-100">
{`# .env.local  (repo root and agrismart/)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Vercel → Project → Settings → Environment Variables
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY  =  AIza...`}
            </pre>
            <p className="mt-1.5 text-[12px] text-muted">
              Then restart <code className="rounded bg-line/40 px-1">npm run dev</code> or redeploy.
              The key is read only from the environment — it never appears in source.
            </p>
          </Step>
          <Step n={4} title="Restrict the key (required before going live)">
            <ul className="mt-1 list-disc space-y-1 pl-5 text-[12px] text-muted">
              <li><b>Application restrictions → HTTP referrers</b>: your domains only, e.g. <code className="rounded bg-line/40 px-1">agrismart-two-neon.vercel.app/*</code> and <code className="rounded bg-line/40 px-1">localhost:3000/*</code> for dev.</li>
              <li><b>API restrictions</b>: limit the key to the three APIs above.</li>
              <li>Set quotas / budget alerts in Cloud Console to cap spend.</li>
            </ul>
          </Step>
        </ol>

        <p className="text-[12px] text-muted">
          Full write-up: <code className="rounded bg-line/40 px-1">docs/google-maps.md</code> in the repository.
          Until a key exists, AgriSmart stays fully functional on the labelled demo map.
        </p>
      </div>
    </Modal>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-leaf-600 text-xs font-extrabold text-white">{n}</span>
      <div className="min-w-0 flex-1">
        <h4 className="font-bold">{title}</h4>
        <div className="mt-0.5 text-[13px] leading-relaxed text-muted">{children}</div>
      </div>
    </li>
  )
}
