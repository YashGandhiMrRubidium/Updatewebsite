import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Grid } from "@/components/Grid";
import { Seo } from "@/components/Seo";
import { useApi, useDebounced } from "@/hooks/useApi";
import { aniList, tmdbList } from "@/lib/media";

const TABS = [["all", "All"], ["movie", "Movies"], ["tv", "TV Shows"], ["anime", "Anime"]];
const SUGGEST = ["Spider-Man", "Naruto", "Breaking Bad", "One Piece", "Avengers", "Stranger Things", "Demon Slayer", "Batman"];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [tab, setTab] = useState("all");
  const dq = useDebounced(q.trim(), 300);

  useEffect(() => {
    setParams(dq ? { q: dq } : {}, { replace: true });
  }, [dq, setParams]);

  const tm = useApi(dq && tab !== "anime" ? `/tmdb/search/multi?query=${encodeURIComponent(dq)}` : null);
  const an = useApi(dq && (tab === "all" || tab === "anime") ? `/anime/list?sort=SEARCH_MATCH&per_page=24&search=${encodeURIComponent(dq)}` : null);
  const trending = useApi(dq ? null : "/tmdb/trending/all/week");

  const tmItems = tmdbList(tm.data).filter((x) => tab === "all" || x.type === tab);
  const items = dq ? (tab === "anime" ? aniList(an.data) : tab === "all" ? [...tmItems, ...aniList(an.data)] : tmItems) : tmdbList(trending.data);
  const loading = dq ? tm.loading || an.loading : trending.loading;

  return (
    <div className="px-4 pt-20 sm:px-8 sm:pt-24 lg:px-14" data-testid="search-page">
      <Seo title={dq ? `Search: ${dq}` : "Search"} />
      <div className="relative mb-4">
        <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search movies, TV shows, anime…" data-testid="search-input"
          className="font-display w-full rounded-lg border border-white/10 bg-[var(--surface)] py-4 pl-12 pr-12 text-lg outline-none transition-[border-color,box-shadow] placeholder:text-gray-600 focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_var(--primary-glow)] sm:text-2xl" />
        {q && (
          <button onClick={() => setQ("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white" aria-label="Clear" data-testid="search-clear">
            <X size={20} />
          </button>
        )}
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {TABS.map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} data-testid={`search-tab-${v}`}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${tab === v ? "bg-white text-black" : "bg-white/5 text-gray-400 hover:text-white"}`}>{l}</button>
        ))}
      </div>
      {!dq && (
        <div className="mb-8">
          <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">Popular searches</p>
          <div className="flex flex-wrap gap-2">
            {SUGGEST.map((s) => (
              <button key={s} onClick={() => setQ(s)} className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-gray-300 hover:border-[var(--primary)] hover:text-white" data-testid={`suggest-${s.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{s}</button>
            ))}
          </div>
          <h2 className="font-display mb-3 mt-8 text-lg font-bold">Trending this week</h2>
        </div>
      )}
      {dq && !loading && <p className="mb-4 text-sm text-gray-500" data-testid="search-count">{items.length} results for “{dq}”</p>}
      <Grid items={items} loading={loading} count={12} testId="search-results" />
      {dq && !loading && !items.length && <p className="py-20 text-center text-gray-500" data-testid="search-empty">No results. Try another title.</p>}
    </div>
  );
}
