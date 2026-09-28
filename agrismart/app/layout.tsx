import type { Metadata, Viewport } from 'next'
import { Inter, Inter_Tight } from 'next/font/google'
import { AuthProvider } from '@/lib/auth'
import './globals.css'

/* Self-hosted at build time — no render-blocking webfont requests. */
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const interTight = Inter_Tight({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-inter-tight', display: 'swap' })
import { ThemeProvider } from '@/components/ThemeProvider'
import IntroGate from '@/components/IntroGate'

export const metadata: Metadata = {
  title: {
    default: 'AgriSmart 2.0 — Smarter Decisions. Better Farming. Higher Returns.',
    template: '%s · AgriSmart 2.0',
  },
  description:
    'AgriSmart is an AI-powered farming platform for crop health, farm finance, market intelligence, government schemes, machinery rental, livestock, aqua farming and farmer community — in English, Telugu and Tenglish.',
  keywords: [
    'AgriSmart', 'smart farming', 'AI crop doctor', 'farm finance', 'mandi prices',
    'agri machinery rental', 'government schemes for farmers', 'aqua farming', 'poultry', 'dairy',
  ],
  authors: [{ name: 'AgriSmart' }],
  openGraph: {
    title: 'AgriSmart 2.0 — AI-Powered Farming',
    description: 'Smarter Decisions. Better Farming. Higher Returns.',
    type: 'website',
    siteName: 'AgriSmart 2.0',
  },
  applicationName: 'AgriSmart 2.0',
  appleWebApp: { capable: true, title: 'AgriSmart', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf8f3' },
    { media: '(prefers-color-scheme: dark)', color: '#0b120e' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

/**
 * Runs synchronously before the intro markup is parsed, so it executes before
 * first paint. It sets one of two states on <html>:
 *
 *   data-intro="seen"    — returning user. CSS hides the overlay entirely, so
 *                          the app paints immediately with no intro flash. The
 *                          inline dark background on <html> is cleared here so
 *                          the theme's own background governs.
 *   data-intro="playing" — first visit. The inline dark background on <html>
 *                          (see below) stays, so the very first frame is dark
 *                          even before a single body node has been parsed.
 *
 * Deliberately inline and blocking: deferring it to a React effect is what let
 * the website show for a frame before the intro.
 */
const INTRO_BOOT = `(function(){try{var d=document.documentElement;var k='agrismart-intro-seen';var s=localStorage.getItem(k)==='1'||sessionStorage.getItem(k)==='1';d.setAttribute('data-intro',s?'seen':'playing');if(s)d.style.background=''}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
     * The inline background is the last line of defence against a white first
     * frame. It is serialised into the opening <html> tag — inside the first
     * ~100 bytes of the document — so the browser paints the intro colour the
     * instant the element exists. No stylesheet and no JavaScript need to have
     * arrived yet, which is exactly the window that a rural 3G connection
     * stretches to hundreds of milliseconds. <body> always has an opaque themed
     * background, so once the page is up this is simply painted over.
     */
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${interTight.variable}`} style={{ background: '#10160a' }}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOT }} />
        <ThemeProvider>
          <AuthProvider>
            <IntroGate>{children}</IntroGate>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
