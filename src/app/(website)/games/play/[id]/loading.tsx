export default function PlayGameLoading() {
  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950 pt-40 md:pt-48 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-[2.5rem] overflow-visible shadow-sm mt-8">
          <div className="p-6 pt-8 space-y-4">
            <div className="h-8 w-3/4 skeleton rounded-lg mx-auto" />
            <div className="aspect-video w-full skeleton rounded-2xl" />
            <div className="h-4 w-1/3 skeleton rounded-md mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
