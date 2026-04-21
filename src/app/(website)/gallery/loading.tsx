export default function GalleryLoading() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="h-9 w-40 skeleton rounded-xl mb-3" />
        <div className="h-5 w-72 skeleton rounded-lg" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={`sk-card-${i}`}
            className="skeleton rounded-2xl"
            style={{ aspectRatio: "16/10" }}
          />
        ))}
      </div>
    </div>
  );
}
