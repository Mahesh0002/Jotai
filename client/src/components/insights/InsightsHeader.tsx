export function InsightsHeader() {
  const tabs = ["AI Insights", "Patterns", "Recommendations", "External Signals"];

  return (
    <div className="flex flex-col border-b border-zinc-800 bg-zinc-950 px-8 pt-8 shrink-0 pb-0">
      {/* Title & Subtitle */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
          Insights & Signals
        </h1>
        <p className="text-sm text-zinc-400">
          AI-powered insights to help you perform better. External signals to keep you informed.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-8">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            className={`pb-4 text-sm font-medium transition-colors relative ${i === 0 ? "text-purple-400" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            {tab}
            {i === 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
