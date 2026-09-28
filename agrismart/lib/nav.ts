/** Single source of truth for navigation so desktop, mobile and the
 *  "More" sheet can never drift apart. */

export type NavItem = {
  href: string
  label: string
  short?: string
  icon: string
  group: 'main' | 'more'
}

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: '🏠', group: 'main' },
  { href: '/farm', label: 'My Farm', short: 'Farm', icon: '🌾', group: 'main' },
  { href: '/start', label: 'Start Farming', short: 'Start', icon: '🌱', group: 'main' },
  { href: '/crop-doctor', label: 'AI Doctor', short: 'AI', icon: '🤖', group: 'main' },
  { href: '/market', label: 'Market', icon: '📈', group: 'main' },
  { href: '/marketplace', label: 'Marketplace', icon: '🛒', group: 'more' },
  { href: '/agrirent', label: 'AgriRent', icon: '🚜', group: 'more' },
  { href: '/schemes', label: 'Schemes', icon: '🏛️', group: 'more' },
  { href: '/community', label: 'Community', icon: '👥', group: 'more' },
]

/** Bottom bar on phones: four shortcuts plus a More sheet. */
export const mobileNav: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: '🏠', group: 'main' },
  { href: '/farm', label: 'Farm', icon: '🌾', group: 'main' },
  { href: '/crop-doctor', label: 'AI', icon: '🤖', group: 'main' },
  { href: '/market', label: 'Market', icon: '📈', group: 'main' },
]

/** Everything else, grouped for the More sheet and the desktop mega-menu. */
export const allSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Farm management',
    items: [
      { href: '/start', label: 'Start Farming', icon: '🌱', group: 'more' },
      { href: '/farm', label: 'My Farm', icon: '🌾', group: 'more' },
      { href: '/planner', label: 'Crop Planner', icon: '🗓️', group: 'more' },
      { href: '/weather', label: 'Weather & Alerts', icon: '🌦️', group: 'more' },
      { href: '/finance', label: 'Farm Finance', icon: '💰', group: 'more' },
    ],
  },
  {
    title: 'Intelligence & services',
    items: [
      { href: '/crop-doctor', label: 'AI Crop Doctor', icon: '🤖', group: 'more' },
      { href: '/market', label: 'Market Intelligence', icon: '📈', group: 'more' },
      { href: '/agrirent', label: 'AgriRent', icon: '🚜', group: 'more' },
      { href: '/vehicles', label: 'Farm Vehicles', icon: '🚚', group: 'more' },
      { href: '/bookings', label: 'Smart Booking', icon: '📅', group: 'more' },
      { href: '/map', label: 'Smart Map', icon: '📍', group: 'more' },
    ],
  },
  {
    title: 'Livestock & aqua',
    items: [
      { href: '/aqua', label: 'Aqua Farming', icon: '🐟', group: 'more' },
      { href: '/poultry', label: 'Poultry', icon: '🐔', group: 'more' },
      { href: '/dairy', label: 'Dairy', icon: '🐄', group: 'more' },
    ],
  },
  {
    title: 'Trade & community',
    items: [
      { href: '/marketplace', label: 'Marketplace', icon: '🛒', group: 'more' },
      { href: '/schemes', label: 'Government Schemes', icon: '🏛️', group: 'more' },
      { href: '/community', label: 'Farmer Community', icon: '👥', group: 'more' },
      { href: '/experts', label: 'Expert Connect', icon: '👨‍🔬', group: 'more' },
      { href: '/learn', label: 'Learning Hub', icon: '📚', group: 'more' },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/notifications', label: 'Notifications', icon: '🔔', group: 'more' },
      { href: '/profile', label: 'Profile', icon: '👤', group: 'more' },
      { href: '/admin', label: 'Admin Dashboard', icon: '🏢', group: 'more' },
    ],
  },
]
