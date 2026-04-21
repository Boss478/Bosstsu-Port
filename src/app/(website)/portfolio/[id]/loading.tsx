export default function PortfolioDetailLoading() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main content — col-span-3 */}
        <div className="lg:col-span-3 space-y-6">
          {/* Hero image */}
          <div className="aspect-video w-full skeleton rounded-2xl" />

          {/* Title + meta */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-2xl p-6 space-y-4">
            <div className="h-8 w-2/3 skeleton rounded-xl" />
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={`sk-tag-${i}`} className="h-6 w-16 skeleton rounded-full" />
              ))}
            </div>
            <div className="h-4 w-full skeleton rounded-md" />
            <div className="h-4 w-5/6 skeleton rounded-md" />
            <div className="h-4 w-4/5 skeleton rounded-md" />
          </div>

          {/* Prev / Next */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-20 skeleton rounded-2xl" />
            <div className="h-20 skeleton rounded-2xl" />
          </div>

          {/* Related */}
          <div className="space-y-4">
            <div className="h-6 w-32 skeleton rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={`sk-related-${i}`} className="h-40 skeleton rounded-2xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar — col-span-1 */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-2xl p-5 space-y-4">
            <div className="h-6 w-24 skeleton rounded-lg" />
            {Array.from({ length: 5 }, (_, i) => (
              <div key={`sk-side-${i}`} className="flex gap-3 items-center">
                <div className="w-16 h-16 skeleton rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full skeleton rounded-md" />
                  <div className="h-3 w-2/3 skeleton rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
