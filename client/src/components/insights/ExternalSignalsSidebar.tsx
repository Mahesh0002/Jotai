import { Newspaper, TrendingUp, CloudRain, ChevronRight, Cloud, CloudSun } from "lucide-react";

export function ExternalSignalsSidebar() {
  const news = [
    {
      source: "TechCrunch",
      title: "AI tools reshape productivity for developers in 2024",
      time: "2h ago",
      icon: "TC",
      color: "bg-emerald-900 text-emerald-400",
    },
    {
      source: "The Wall Street Journal",
      title: "Markets rally on AI optimism and rate cut outlook",
      time: "5h ago",
      icon: "W",
      color: "bg-blue-900 text-blue-400",
    },
    {
      source: "The Verge",
      title: "New open-source model achieves state-of-the-art with less compute",
      time: "8h ago",
      icon: "V",
      color: "bg-purple-900 text-purple-400",
    },
  ];

  const markets = [
    { name: "NIFTY 50", val: "24,812.50", change: "+1.12%" },
    { name: "SENSEX", val: "81,234.67", change: "+0.89%" },
    { name: "NASDAQ", val: "18,273.61", change: "+1.42%" },
    { name: "BTC / USD", val: "67,892.21", change: "+2.35%" },
  ];

  const forecast = [
    { time: "Now", icon: CloudSun, temp: "18°" },
    { time: "11 AM", icon: CloudSun, temp: "20°" },
    { time: "2 PM", icon: Cloud, temp: "21°" },
    { time: "5 PM", icon: CloudSun, temp: "19°" },
    { time: "8 PM", icon: Cloud, temp: "16°" },
  ];

  return (
    <div className="flex w-[320px] shrink-0 flex-col gap-6 overflow-y-auto custom-scrollbar p-6 border-l border-zinc-800/50 bg-zinc-950/50">
      {/* NEWS DISPATCH */}
      <div className="flex flex-col rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Newspaper className="h-3.5 w-3.5 text-zinc-500" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              News Dispatch
            </h3>
          </div>
          <button className="text-[10px] text-zinc-500 hover:text-white flex items-center">
            View all <ChevronRight className="h-3 w-3 ml-0.5" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {news.map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold ${item.color}`}
              >
                {item.icon}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-medium text-zinc-500">{item.source}</span>
                <p className="text-[11px] font-medium leading-snug text-zinc-200 line-clamp-2">
                  {item.title}
                </p>
                <span className="text-[9px] text-zinc-600 mt-0.5">{item.time}</span>
              </div>
            </div>
          ))}
        </div>

        <button className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center mt-4 border-t border-zinc-800/50 pt-4">
          See all news <ChevronRight className="h-3 w-3 ml-1" />
        </button>
      </div>

      {/* MARKET WATCH */}
      <div className="flex flex-col rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-zinc-500" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Market Watch
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            Live
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {markets.map((m, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-400">{m.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-medium text-white">{m.val}</span>
                <span className="text-[11px] font-bold text-emerald-500 w-12 text-right">
                  {m.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center mt-5 border-t border-zinc-800/50 pt-4">
          View full markets <ChevronRight className="h-3 w-3 ml-1" />
        </button>
      </div>

      {/* WEATHER RADAR */}
      <div className="flex flex-col rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CloudRain className="h-3.5 w-3.5 text-zinc-500" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Weather Radar
            </h3>
          </div>
          <button className="text-[9px] text-zinc-500 hover:text-white flex items-center">
            Hyderabad, IN <ChevronRight className="h-3 w-3 ml-0.5" />
          </button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <span className="text-4xl font-light text-white tracking-tighter">
              18<span className="text-2xl text-zinc-500">°C</span>
            </span>
            <span className="text-[11px] font-medium text-zinc-400 mt-1">Partly cloudy</span>
          </div>
          <CloudSun className="h-10 w-10 text-amber-500/80" />
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-zinc-500">Feels like</span>
            <span className="text-[11px] font-medium text-white">17°C</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-zinc-500">Humidity</span>
            <span className="text-[11px] font-medium text-white">62%</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-zinc-500">Wind</span>
            <span className="text-[11px] font-medium text-white">
              12 <span className="text-[9px] text-zinc-500">km/h</span>
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-zinc-500">AQI</span>
            <span className="text-[11px] font-bold text-emerald-500 leading-none">26</span>
            <span className="text-[9px] text-emerald-500/70">Good</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800/50 pt-5 mb-2">
          {forecast.map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className="text-[8px] font-medium text-zinc-500">{f.time}</span>
              <f.icon className="h-4 w-4 text-zinc-400" />
              <span className="text-[10px] font-bold text-white">{f.temp}</span>
            </div>
          ))}
        </div>

        <button className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center mt-4">
          View full forecast <ChevronRight className="h-3 w-3 ml-1" />
        </button>
      </div>
    </div>
  );
}
