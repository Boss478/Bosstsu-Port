export default function AlbumDetailLoading() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 space-y-3">
        <div className="h-9 w-64 skeleton rounded-xl" />
        <div className="h-5 w-96 skeleton rounded-lg" />
        <div className="h-4 w-32 skeleton rounded-md" />
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={`sk-photo-${i}`}
            className="h-60 skeleton rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}
