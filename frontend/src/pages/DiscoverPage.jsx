import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { Chips, Grid } from "@/components/Grid";
import { Seo } from "@/components/Seo";
import { VibeChip } from "@/components/VibePicker";
import { cachedGet } from "@/lib/api";
import { MOVIE_GENRES, TV_GENRES, tmdbList } from "@/lib/media";
import { VIBES } from "@/lib/vibes";

const ANY = ["", "Any"];
const RATINGS = [ANY, ["7", "7+"], ["7.5", "7.5+"], ["8", "8+"], ["8.5", "8.5+"]];
const ERAS = { classic: ["", "1979-12-31"], "80s": ["1980-01-01", "1989-12-31"], "90s": ["1990-01-01", "1999-12-31"], "2000s": ["2000-01-01", "2009-12-31"], "2010s": ["2010-01-01", "2019-12-31"], "2020s": ["2020-01-01", ""] };
const LENGTHS = { short: ["", "89"], mid: ["90", "150"], long: ["150", ""] };
const LANGS = [ANY, ["en", "EN"], ["hi", "HI"], ["ko", "KO"], ["ja", "JA"], ["ta", "TA"], ["te", "TE"], ["fr", "FR"], ["es", "ES"], ["pt", "PT"], ["zh", "ZH"], ["it", "IT"], ["de", "DE"]];
const SORTS = [["trending", "Trending"], ["top", "Top Rated"], ["new", "Newest"]];

const buildUrl = (f, page) => {
  const t = f.type;
  const date = t === "movie" ? "primary_release_date" : "first_air_date";
  const vibe = VIBES.find((v) => v.id === f.vibe);
  const genres = f.genre || (vibe ? vibe.genres[t === "movie" ? 0 : 1] : "");
  const [from, to] = ERAS[f.era] || ["", ""];
  const [rmin, rmax] = LENGTHS[f.len] || ["", ""];
  const today = new Date().toISOString().slice(0, 10);
  const q = {
    sort_by: f.sort === "top" ? "vote_average.desc" : f.sort === "new" ? `${date}.desc` : "popularity.desc",
    "vote_count.gte": f.sort === "top" ? 300 : f.sort === "new" ? 20 : 50,
    with_genres: genres, "vote_average.gte": f.rating, with_original_language: f.lang,
    [`${date}.gte`]: from, [`${date}.lte`]: to || today, "with_runtime.gte": rmin, "with_runtime.lte": rmax, page,
  };
  return `/tmdb/discover/${t}?${Object.entries(q).filter(([, v]) => v !== "" && v !== undefined).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&")}`;
};

const FilterRow = ({ label, children }) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
    <span className="w-24 shrink-0 text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">{label}</span>
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

export default function DiscoverPage() {
  const [params, setParams] = useSearchParams();
  const f = { type: params.get("type") || "movie", vibe: params.get("vibe") || "", sort: params.get("sort") || "trending", rating: params.get("rating") || "", genre: params.get("genre") || "", era: params.get("era") || "", len: params.get("len") || "", lang: params.get("lang") || "" };
  const fkey = JSON.stringify(f);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [more, setMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const vibe = VIBES.find((v) => v.id === f.vibe);

  useEffect(() => { setPage(1); setItems([]); }, [fkey]);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    cachedGet(buildUrl(JSON.parse(fkey), page))
      .then((d) => {
        if (!alive) return;
        const list = tmdbList(d, JSON.parse(fkey).type);
        setItems((prev) => (page === 1 ? list : [...prev, ...list.filter((x) => !prev.some((p) => p.id === x.id))]));
        setMore(d.page < d.total_pages);
      })
      .catch(() => alive && setMore(false))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [fkey, page]);

  const set = (k, v) => {
    const n = new URLSearchParams(params);
    v ? n.set(k, v) : n.delete(k);
    if (k === "type") n.delete("genre");
    setParams(n, { replace: true });
  };
  const VIcon = vibe?.icon || Sparkles;

  return (
    <div className="px-4 pt-20 sm:px-8 sm:pt-24 lg:px-14" data-testid="discover-page">
      <Seo title={vibe ? `${vibe.name} ${f.type === "movie" ? "Movies" : "TV Shows"} to Watch Free` : "Discover Movies & TV by Mood"} description={`Find ${vibe ? vibe.tag.toLowerCase() : "great"} movies and TV shows to stream free in HD. Filter by mood, rating, genre, era, length and language.`} />
      <p className="mb-2 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-[#ff4d52]"><span className="h-px w-8 bg-[var(--brand)]" /> Picked for tonight</p>
      <h1 className="font-display flex items-center gap-3 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl" data-testid="discover-title">
        <VIcon size={44} style={{ color: vibe?.color || "var(--brand)" }} />
        {vibe ? `${vibe.name} ${f.type === "movie" ? "Films" : "Series"}` : "Discover"}
      </h1>
      <p className="mt-1 text-gray-400">{vibe ? vibe.tag : "Mix and match filters to find your next favourite."}</p>

      <div className="mt-6 flex flex-wrap gap-2.5">
        {VIBES.map((v) => <VibeChip key={v.id} v={v} active={v.id === f.vibe} onClick={() => set("vibe", v.id === f.vibe ? "" : v.id)} />)}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex gap-2">
          {[["movie", "Movies"], ["tv", "TV Shows"]].map(([v, l]) => (
            <button key={v} onClick={() => set("type", v === "movie" ? "" : v)} data-testid={`discover-type-${v}`}
              className={`rounded-full border px-5 py-2 text-sm font-semibold transition-colors ${f.type === v ? "border-[var(--brand)] bg-[var(--brand)]/15 text-white" : "border-white/10 text-gray-400 hover:text-white"}`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-2">
          {SORTS.map(([v, l]) => (
            <button key={v} onClick={() => set("sort", v === "trending" ? "" : v)} data-testid={`discover-sort-${v}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${f.sort === v ? "border-[var(--brand)] bg-[var(--brand)]/15 text-white" : "border-white/10 text-gray-400 hover:text-white"}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-4" data-testid="discover-filters">
        <FilterRow label="Rating"><Chips options={RATINGS} value={f.rating} onChange={(v) => set("rating", v)} testPrefix="filter-rating" /></FilterRow>
        <FilterRow label="Genre"><Chips options={[["", "All"], ...(f.type === "movie" ? MOVIE_GENRES : TV_GENRES)]} value={f.genre} onChange={(v) => set("genre", v)} testPrefix="filter-genre" /></FilterRow>
        <FilterRow label="Era"><Chips options={[["", "All"], ["classic", "Classic"], ["80s", "80s"], ["90s", "90s"], ["2000s", "2000s"], ["2010s", "2010s"], ["2020s", "2020s"]]} value={f.era} onChange={(v) => set("era", v)} testPrefix="filter-era" /></FilterRow>
        <FilterRow label="Length"><Chips options={[ANY, ["short", "< 90 min"], ["mid", "90–150 min"], ["long", "2h 30m+"]]} value={f.len} onChange={(v) => set("len", v)} testPrefix="filter-length" /></FilterRow>
        <FilterRow label="Language"><Chips options={LANGS} value={f.lang} onChange={(v) => set("lang", v)} testPrefix="filter-lang" /></FilterRow>
      </div>

      <AdSlot placement="browse_top" className="my-6" />
      <div className="mt-8"><Grid items={items} loading={loading} testId="discover-grid" /></div>
      {!loading && !items.length && <p className="py-20 text-center text-gray-500" data-testid="discover-empty">No matches. Try loosening a filter.</p>}
      {more && !loading && items.length > 0 && (
        <div className="mt-8 flex justify-center">
          <button onClick={() => setPage((p) => p + 1)} className="btn-ghost rounded-full px-8 py-2.5 text-sm font-semibold" data-testid="discover-load-more">Load more</button>
        </div>
      )}
    </div>
  );
}
