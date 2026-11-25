import { useQuery } from "@tanstack/react-query";
import { CloudSun, Newspaper, TrendingUp } from "lucide-react";
import { signalsApi } from "@/lib/api";

const CITY = "Hyderabad";
const SYMBOL = "BTC/USD";

function formatTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function ExternalSignalsSidebar() {
  const news = useQuery({
    queryKey: ["signals", "news"],
    queryFn: () => signalsApi.getNews(),
    staleTime: 5 * 60_000,
  });
  const stock = useQuery({
    queryKey: ["signals", "stock", SYMBOL],
    queryFn: () => signalsApi.getStock(SYMBOL),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const weather = useQuery({
    queryKey: ["signals", "weather", CITY],
    queryFn: () => signalsApi.getWeather(CITY),
    staleTime: 10 * 60_000,
  });

  const positive = (stock.data?.change ?? 0) >= 0;

  return (
    <div className="flex w-[320px] shrink-0 flex-col gap-6 overflow-y-auto custom-scrollbar p-6 border-l border-zinc-800/50 bg-zinc-950/50">
      {/* NEWS DISPATCH */}
      <div className="flex flex-col rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
        <div className="mb-5 flex items-center gap-2">
          <Newspaper className="h-3.5 w-3.5 text-zinc-500" />
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
            News Dispatch
          </h3>
        </div>

        {news.isPending ? (
          <p className="text-[11px] text-zinc-500">Loading headlines…</p>
        ) : news.isError ? (
          <p className="text-[11px] text-zinc-500">Headlines unavailable — check the news API key.</p>
        ) : (news.data?.length ?? 0) === 0 ? (
          <p className="text-[11px] text-zinc-500">No headlines right now.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {news.data?.slice(0, 5).map((article, index) => {
              const source = article.source || "Source";
              return (
                <div key={`${article.url ?? article.title}-${index}`} className="flex gap-3 items-start">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-purple-900/40 text-[10px] font-bold text-purple-300">
                    {source.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-medium text-zinc-500">{source}</span>
                    {article.url ? (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-medium leading-snug text-zinc-200 line-clamp-2 hover:text-purple-300"
                      >
                        {article.title}
                      </a>
                    ) : (
                      <p className="text-[11px] font-medium leading-snug text-zinc-200 line-clamp-2">
                        {article.title}
                      </p>
                    )}
                    <span className="mt-0.5 text-[9px] text-zinc-600">{formatTime(article.publishedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MARKET WATCH */}
      <div className="flex flex-col rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-zinc-500" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Market Watch
            </h3>
          </div>
          {stock.data ? (
            <span className="text-[9px] font-bold text-emerald-500">Live</span>
          ) : null}
        </div>

        {stock.isPending ? (
          <p className="text-[11px] text-zinc-500">Loading quote…</p>
        ) : stock.isError || !stock.data ? (
          <p className="text-[11px] text-zinc-500">Quote unavailable — check the market API key.</p>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400">{stock.data.symbol}</span>
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-medium text-white">
                {stock.data.price.toLocaleString()}
              </span>
              <span
                className={`w-16 text-right text-[11px] font-bold ${positive ? "text-emerald-500" : "text-red-400"}`}
              >
                {positive ? "+" : ""}
                {stock.data.percent_change.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* WEATHER RADAR */}
      <div className="flex flex-col rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
        <div className="mb-5 flex items-center gap-2">
          <CloudSun className="h-3.5 w-3.5 text-zinc-500" />
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
            Weather Radar
          </h3>
        </div>

        {weather.isPending ? (
          <p className="text-[11px] text-zinc-500">Loading weather…</p>
        ) : weather.isError || !weather.data ? (
          <p className="text-[11px] text-zinc-500">Weather unavailable — check the weather API key.</p>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-4xl font-light tracking-tighter text-white">
                  {Math.round(weather.data.current.temp_c)}
                  <span className="text-2xl text-zinc-500">°C</span>
                </span>
                <span className="mt-1 text-[11px] font-medium text-zinc-400">
                  {weather.data.current.condition?.text ?? "Current conditions"}
                </span>
              </div>
              <CloudSun className="h-10 w-10 text-amber-500/80" />
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-zinc-800/50 pt-4">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-zinc-500">Feels like</span>
                <span className="text-[11px] font-medium text-white">
                  {Math.round(weather.data.current.feelslike_c)}°C
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-zinc-500">Humidity</span>
                <span className="text-[11px] font-medium text-white">
                  {weather.data.current.humidity}%
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-zinc-500">Wind</span>
                <span className="text-[11px] font-medium text-white">
                  {Math.round(weather.data.current.wind_kph)} km/h
                </span>
              </div>
            </div>
            <p className="mt-4 text-[9px] text-zinc-600">{weather.data.location.name}</p>
          </>
        )}
      </div>
    </div>
  );
}
