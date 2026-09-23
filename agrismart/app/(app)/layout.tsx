import Navbar from '@/components/Navbar'
import AIAssistant from '@/components/AIAssistant'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* Ambient depth — two soft washes, fixed so they never cause repaints
          on scroll. Purely decorative, hidden from assistive tech. */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-hero-glow" aria-hidden />
      <div className="bg-noise pointer-events-none fixed inset-0 -z-10 opacity-40" aria-hidden />

      <Navbar />

      <main
        id="main"
        // Room for the fixed top bar, plus the mobile bottom nav on phones.
        className="pt-24 pb-28 sm:pt-28 lg:pb-16"
      >
        {children}
      </main>

      <AIAssistant />

      <footer className="border-t border-line/60 pb-28 lg:pb-10">
        <div className="section py-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-leaf-gradient text-lg shadow-glow" aria-hidden>🌾</span>
                <span className="font-display text-base font-black tracking-tight">AgriSmart 2.0</span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
                Smarter Decisions. Better Farming. Higher Returns.
              </p>
              <p className="mt-3 text-xs text-faint">
                English · తెలుగు · Tenglish
              </p>
            </div>

            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-faint">Farm</p>
              <ul className="space-y-2 text-sm text-muted">
                <li><a className="footer-link" href="/farm">My Farm</a></li>
                <li><a className="footer-link" href="/planner">Crop Planner</a></li>
                <li><a className="footer-link" href="/weather">Weather & Alerts</a></li>
                <li><a className="footer-link" href="/finance">Farm Finance</a></li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-faint">Services</p>
              <ul className="space-y-2 text-sm text-muted">
                <li><a className="footer-link" href="/crop-doctor">AI Crop Doctor</a></li>
                <li><a className="footer-link" href="/agrirent">AgriRent</a></li>
                <li><a className="footer-link" href="/schemes">Government Schemes</a></li>
                <li><a className="footer-link" href="/map">Smart Map</a></li>
              </ul>
            </div>

            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-faint">Community</p>
              <ul className="space-y-2 text-sm text-muted">
                <li><a className="footer-link" href="/marketplace">Marketplace</a></li>
                <li><a className="footer-link" href="/community">Farmer Community</a></li>
                <li><a className="footer-link" href="/experts">Expert Connect</a></li>
                <li><a className="footer-link" href="/learn">Learning Hub</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-gold-400/30 bg-gold-400/10 p-4 text-xs leading-relaxed text-muted">
            <p className="mb-1 font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
              ◆ Prototype notice
            </p>
            <p>
              AgriSmart 2.0 is a hackathon prototype. All prices, yields, profits, weather, scheme
              details and AI assessments shown here are illustrative sample data, not live feeds or
              professional advice. Verify market prices at your local market yard and confirm scheme
              eligibility on official government portals before acting.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-faint">
            © 2026 AgriSmart · Built for the AgriSmart 2.0 Hackathon
          </p>
        </div>
      </footer>
    </div>
  )
}
