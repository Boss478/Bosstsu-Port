export default function GamesLoading() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="h-9 w-44 skeleton rounded-xl mb-3" />
        <div className="h-5 w-72 skeleton rounded-lg" />
      </div>

      {/* Search bar */}
      <div className="flex justify-center mb-12">
        <div className="h-16 w-full max-w-2xl skeleton rounded-3xl" />
      </div>

      {/* Category group 1 */}
      <div className="mb-12 space-y-6">
        <div className="h-7 w-36 skeleton rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={`sk-game-a-${i}`}
              className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-[2.5rem] overflow-visible shadow-sm mt-8"
            >
              {/* Floating play button */}
              <div className="absolute -top-8 right-8 w-16 h-16 skeleton rounded-3xl" />
              <div className="p-6 pt-8 space-y-3">
                <div className="h-6 w-3/4 skeleton rounded-lg" />
                <div className="h-4 w-full skeleton rounded-md" />
                <div className="h-4 w-5/6 skeleton rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category group 2 */}
      <div className="space-y-6">
        <div className="h-7 w-44 skeleton rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={`sk-game-b-${i}`}
              className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-[2.5rem] overflow-visible shadow-sm mt-8"
            >
              <div className="absolute -top-8 right-8 w-16 h-16 skeleton rounded-3xl" />
              <div className="p-6 pt-8 space-y-3">
                <div className="h-6 w-2/3 skeleton rounded-lg" />
                <div className="h-4 w-full skeleton rounded-md" />
                <div className="h-4 w-4/5 skeleton rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
