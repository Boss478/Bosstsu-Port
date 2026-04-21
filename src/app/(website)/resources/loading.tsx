export default function ResourcesLoading() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="h-9 w-52 skeleton rounded-xl mb-3" />
        <div className="h-5 w-80 skeleton rounded-lg" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={`sk-filter-${i}`} className="h-8 w-24 skeleton rounded-full" />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={`sk-card-${i}`}
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm flex flex-col"
          >
            {/* Image — gotcha fix: relative + shrink-0, no child */}
            <div className="relative aspect-video overflow-hidden shrink-0 skeleton" />

            {/* Body */}
            <div className="p-4 space-y-3 flex-1">
              {/* Type badge */}
              <div className="h-5 w-16 skeleton rounded-full" />

              {/* Title */}
              <div className="h-5 w-full skeleton rounded-lg" />
              <div className="h-5 w-2/3 skeleton rounded-lg" />

              {/* Description */}
              <div className="h-4 w-full skeleton rounded-md" />
              <div className="h-4 w-4/5 skeleton rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
