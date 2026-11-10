const IMG = "https://image.tmdb.org/t/p/";

export const img = (p, size = "w342") => (p ? `${IMG}${size}${p}` : null);
const strip = (s) => (s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

export const slugify = (s) =>
  (s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);

export function fromTmdb(it, fallback = "movie") {
  const type = it.media_type === "tv" || it.media_type === "movie" ? it.media_type : fallback;
  const date = it.release_date || it.first_air_date || "";
  return {
    id: it.id,
    type,
    title: it.title || it.name || "Untitled",
    poster: img(it.poster_path),
    backdrop: img(it.backdrop_path, "w1280"),
    year: date.slice(0, 4),
    rating: it.vote_average ? Number(it.vote_average).toFixed(1) : null,
    overview: it.overview || "",
    genres: (it.genres || []).map((g) => g.name),
  };
}

export function fromAni(m) {
  return {
    id: m.id,
    type: "anime",
    title: m.title?.english || m.title?.romaji || "Untitled",
    poster: m.coverImage?.large || m.coverImage?.extraLarge,
    backdrop: m.bannerImage || m.coverImage?.extraLarge,
    year: m.seasonYear ? String(m.seasonYear) : "",
    rating: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
    overview: strip(m.description),
    genres: m.genres || [],
    episodes: m.episodes,
  };
}

export const tmdbList = (data, fb) =>
  (data?.results || [])
    .filter((r) => r.media_type !== "person" && (r.poster_path || r.backdrop_path))
    .map((r) => fromTmdb(r, fb));

export const aniList = (data) => (data?.media || []).map(fromAni);

export const titlePath = (it) => `/${it.type}/${it.id}/${slugify(it.title)}`;
export const watchPath = (it) =>
  it.type === "tv"
    ? `/watch/tv/${it.id}?s=1&e=1`
    : it.type === "anime"
    ? `/watch/anime/${it.id}?ep=1&lang=sub`
    : `/watch/movie/${it.id}`;

export const MOVIE_GENRES = [
  [28, "Action"], [12, "Adventure"], [16, "Animation"], [35, "Comedy"], [80, "Crime"], [99, "Documentary"],
  [18, "Drama"], [10751, "Family"], [14, "Fantasy"], [36, "History"], [27, "Horror"], [10402, "Music"],
  [9648, "Mystery"], [10749, "Romance"], [878, "Sci-Fi"], [53, "Thriller"], [10752, "War"], [37, "Western"],
];
export const TV_GENRES = [
  [10759, "Action & Adventure"], [16, "Animation"], [35, "Comedy"], [80, "Crime"], [99, "Documentary"],
  [18, "Drama"], [10751, "Family"], [10762, "Kids"], [9648, "Mystery"], [10764, "Reality"],
  [10765, "Sci-Fi & Fantasy"], [10768, "War & Politics"], [37, "Western"],
];
export const ANIME_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mecha", "Music", "Mystery",
  "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller",
].map((g) => [g, g]);
