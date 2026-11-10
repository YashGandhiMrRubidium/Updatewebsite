import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Chips, Grid } from "@/components/Grid";
import { Seo } from "@/components/Seo";
import { cachedGet } from "@/lib/api";
import { ANIME_GENRES, MOVIE_GENRES, TV_GENRES, aniList, tmdbList } from "@/lib/media";

const CONF = {
  movie: {
    title: "Movies", genres: MOVIE_GENRES, sorts: [["popularity.desc", "Popular"], ["vote_average.desc", "Top Rated"], ["primary_release_date.desc", "Newest"]],
    url: (g, s, p) => `/tmdb/discover/movie?sort_by=${s}&page=${p}&vote_count.gte=${s === "popularity.desc" ? 0 : 150}${g ? `&with_genres=${g}` : ""}&primary_release_date.lte=${new Date().toISOString().slice(0, 10)}`,
    map: (d) => ({ items: tmdbList(d, "movie"), more: d.page < d.total_pages }),
  },
  tv: {
    title: "TV Shows", genres: TV_GENRES, sorts: [["popularity.desc", "Popular"], ["vote_average.desc", "Top Rated"], ["first_air_date.desc", "Newest"]],
    url: (g, s, p) => `/tmdb/discover/tv?sort_by=${s}&page=${p}&vote_count.gte=${s === "popularity.desc" ? 0 : 100}${g ? `&with_genres=${g}` : ""}&first_air_date.lte=${new Date().toISOString().slice(0, 10)}`,
    map: (d) => ({ items: tmdbList(d, "tv"), more: d.page < d.total_pages }),
  },
  anime: {
    title: "Anime", genres: ANIME_GENRES, sorts: [["TRENDING_DESC", "Trending"], ["POPULARITY_DESC", "Popular"], ["SCORE_DESC", "Top Rated"]],
    url: (g, s, p) => `/anime/list?sort=${s}&page=${p}&per_page=30${g ? `&genre=${encodeURIComponent(g)}` : ""}`,
    map: (d) => ({ items: aniList(d), more: !!d.pageInfo?.hasNextPage }),
  },
};

export default function BrowsePage({ type }) {
  const c = CONF[type];
  const [params, setParams] = useSearchParams();
  const genre = params.get("genre") || "";
  const sort = params.get("sort") || c.sorts[0][0];
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [more, setMore] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [type, genre, sort]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    cachedGet(c.url(genre, sort, page))
      .then((d) => {
        if (!alive) return;
        const r = c.map(d);
        setItems((prev) => {
          const seen = new Set(prev.map((x) => x.id));
          return page === 1 ? r.items : [...prev, ...r.items.filter((x) => !seen.has(x.id))];
        });
        setMore(r.more);
      })
      .catch(() => alive && setMore(false))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [c, type, genre, sort, page]);

  const update = (k, v) => {
    const n = new URLSearchParams(params);
    v ? n.set(k, v) : n.delete(k);
    setParams(n, { replace: true });
  };
  const genreName = c.genres.find(([v]) => String(v) === String(genre))?.[1];

  return (
    <div className="px-4 pt-20 sm:px-8 sm:pt-24 lg:px-14" data-testid={`browse-page-${type}`}>
      <Seo title={genreName ? `${genreName} ${c.title}` : c.title} description={`Browse and stream ${genreName || "the best"} ${c.title.toLowerCase()} online in HD.`} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="fade-up">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em] text-[var(--primary)]">Browse</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl" data-testid="browse-title">{genreName ? `${genreName}` : c.title}</h1>
        </div>
        <div className="flex gap-1 rounded-full bg-white/5 p-1" data-testid="sort-tabs">
          {c.sorts.map(([v, l]) => (
            <button key={v} onClick={() => update("sort", v)} data-testid={`sort-${l.toLowerCase().replace(/\s/g, "-")}`}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${sort === v ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="mb-6">
        <Chips options={c.genres} value={genre} onChange={(v) => update("genre", v)} testPrefix="genre" />
      </div>
      <Grid items={items} loading={loading} />
      {!loading && !items.length && <p className="py-20 text-center text-gray-500" data-testid="browse-empty">Nothing found here.</p>}
      {more && !loading && items.length > 0 && (
        <div className="mt-8 flex justify-center">
          <button onClick={() => setPage((p) => p + 1)} className="btn-ghost rounded-full px-8 py-2.5 text-sm font-semibold" data-testid="load-more-button">Load more</button>
        </div>
      )}
    </div>
  );
}
