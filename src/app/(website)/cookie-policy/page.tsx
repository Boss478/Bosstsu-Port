import Link from 'next/link';

const sections = [
  {
    title: 'What Data We Collect',
    icon: 'fi fi-sr-chart-pie',
    items: [
      'Pages you visit (path)',
      'Device type (desktop / tablet / mobile)',
      'Referrer URL (where you came from)',
      'Browser technical info (user agent, screen size)',
      'Web performance metrics (LCP, CLS, INP)',
    ],
  },
  {
    title: 'How We Store It',
    icon: 'fi fi-sr-database',
    items: [
      'Consent preference → localStorage (persistent)',
      'Session ID → sessionStorage (cleared on tab close)',
      'Analytics data → our own MongoDB server',
    ],
  },
  {
    title: "What We DON'T Do",
    icon: 'fi fi-sr-shield-check',
    items: [
      'No cookies (no tracking, no third-party, no advertising)',
      'No personal information (name, email, address)',
      'No raw IP addresses (hashed with salt)',
      'No cross-site tracking',
      'No data sold or shared with third parties',
    ],
  },
  {
    title: 'Your Choices',
    icon: 'fi fi-sr-user-settings',
    items: [
      'Click "Accept" to opt in — tracking starts immediately',
      'Click "Decline" to opt out — no data collected',
      'Change your mind? Clear localStorage (boss478-analytics-consent)',
      'Enable "Do Not Track" (DNT) in your browser — we honor it (HTTP 451)',
    ],
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <i className="fi fi-sr-cookie inline-block text-5xl text-blue-500 mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-3">
            Cookie Policy
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
            How this site collects and uses browsing data to improve your experience. Last updated:
            June 2026
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.title}
              className="p-6 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/80 dark:border-slate-700/60 shadow-lg shadow-blue-500/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <i className={`${section.icon} text-xl text-blue-500`} />
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400 text-sm"
                  >
                    <i className="fi fi-sr-circle-small mt-0.5 text-blue-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/80 dark:border-slate-700/60 shadow-lg shadow-blue-500/5">
          <div className="flex items-center gap-3 mb-3">
            <i className="fi fi-sr-info text-xl text-blue-500" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Why No Cookies?</h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            This site uses localStorage and sessionStorage instead of HTTP cookies for analytics.
            Unlike cookies, these storage APIs don&apos;t send data with every request, are not
            accessible across domains, and don&apos;t require the same regulatory consent. Your data
            stays on your device until explicitly sent to our server via a secure API call.
          </p>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
          >
            <i className="fi fi-sr-arrow-left" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
