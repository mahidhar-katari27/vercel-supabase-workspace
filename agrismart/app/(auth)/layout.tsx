/* Standalone premium shell for auth + onboarding: no navbar, no footer —
   the flow owns the whole viewport. Theme + auth providers come from root. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="relative min-h-screen bg-bg text-ink">{children}</div>
}
