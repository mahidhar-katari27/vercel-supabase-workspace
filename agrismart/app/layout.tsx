import type { Metadata, Viewport } from 'next'
import './globals.css'
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <IntroGate>{children}</IntroGate>
        </ThemeProvider>
      </body>
    </html>
  )
}
