import { Link } from "react-router-dom";
import { Hero } from "@/components/Hero";
import { ApiRow, Row } from "@/components/Row";
import { Seo } from "@/components/Seo";
import { useApi } from "@/hooks/useApi";
import { aniList, fromAni, fromTmdb, tmdbList, MOVIE_GENRES } from "@/lib/media";
import { useMyList, useStored } from "@/lib/store";

const BecauseYouWatched = () => {
  const [history] = useStored("cs:history", []);
  const last = history[0];
  if (!last) return null;
  const url = last.type === "anime" ? `/anime/${last.id}` : `/tmdb/${last.type}/${last.id}/recommendations`;
  const map = (d) =>
    last.type === "anime"
      ? (d.recommendations?.nodes || []).map((n) => n.mediaRecommendation).filter(Boolean).map(fromAni)
      : (d.results || []).filter((r) => r.poster_path).map((r) => fromTmdb(r, last.type));
  return <ApiRow key={`${last.type}${last.id}`} title={`Because you watched ${last.title}`} url={url} map={map} testId="row-because-you-watched" />;
};

const CategoryStrip = () => (
  <section className="px-4 sm:px-8 lg:px-14" data-testid="category-strip">
    <h2 className="font-display mb-3 text-base font-bold sm:text-lg lg:text-xl">Browse by category</h2>
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {[["/anime", "Anime"], ["/tv", "TV Shows"], ...MOVIE_GENRES.map(([id, n]) => [`/movies?genre=${id}`, n])].map(([to, n], i) => (
        <Link key={to} to={to} data-testid={`category-${n.toLowerCase().replace(/[^a-z]+/g, "-")}`}
          className={`shrink-0 rounded-md border px-4 py-2 text-sm font-medium transition-[background-color,border-color,transform] hover:-translate-y-0.5 ${i < 2 ? "border-[var(--primary)]/50 bg-[var(--primary)]/10 text-white hover:bg-[var(--primary)]/25" : "border-white/10 bg-[var(--surface)] text-gray-300 hover:border-white/30 hover:text-white"}`}>
          {n}
        </Link>
      ))}
    </div>
  </section>
);

const movies = (d) => tmdbList(d, "movie");
const tv = (d) => tmdbList(d, "tv");

export default function HomePage() {
  const { data, loading } = useApi("/tmdb/trending/all/day");
  const { list } = useMyList();
  const trending = tmdbList(data);
  return (
    <div data-testid="home-page">
      <Seo />
      <Hero items={trending} loading={loading} />
      <div className="relative z-10 -mt-10 space-y-6 sm:-mt-16 sm:space-y-8">
        <Row title="Trending Now" items={trending} loading={loading} testId="row-trending" />
        {list.length > 0 && <Row title="My List" items={list} to="/my-list" testId="row-my-list" />}
        <BecauseYouWatched />
        <ApiRow title="Popular Movies" url="/tmdb/movie/popular" map={movies} to="/movies" testId="row-popular-movies" />
        <ApiRow title="Trending Anime" url="/anime/list?sort=TRENDING_DESC&per_page=20" map={aniList} to="/anime" testId="row-trending-anime" />
        <CategoryStrip />
        <ApiRow title="Popular TV Shows" url="/tmdb/tv/popular" map={tv} to="/tv" testId="row-popular-tv" />
        <ApiRow title="Top Rated Movies" url="/tmdb/movie/top_rated" map={movies} to="/movies?sort=vote_average.desc" testId="row-top-rated" />
        <ApiRow title="Now in Cinemas" url="/tmdb/movie/now_playing" map={movies} testId="row-now-playing" />
        <ApiRow title="Action & Adventure" url="/tmdb/discover/movie?with_genres=28&sort_by=popularity.desc" map={movies} to="/movies?genre=28" testId="row-action" />
        <ApiRow title="All-Time Popular Anime" url="/anime/list?sort=POPULARITY_DESC&per_page=20" map={aniList} to="/anime?sort=POPULARITY_DESC" testId="row-popular-anime" />
        <ApiRow title="Comedy" url="/tmdb/discover/movie?with_genres=35&sort_by=popularity.desc" map={movies} to="/movies?genre=35" testId="row-comedy" />
        <ApiRow title="Horror Nights" url="/tmdb/discover/movie?with_genres=27&sort_by=popularity.desc" map={movies} to="/movies?genre=27" testId="row-horror" />
        <ApiRow title="Sci-Fi Worlds" url="/tmdb/discover/movie?with_genres=878&sort_by=popularity.desc" map={movies} to="/movies?genre=878" testId="row-scifi" />
        <ApiRow title="Romance" url="/tmdb/discover/movie?with_genres=10749&sort_by=popularity.desc" map={movies} to="/movies?genre=10749" testId="row-romance" />
        <ApiRow title="Top Rated TV" url="/tmdb/tv/top_rated" map={tv} to="/tv?sort=vote_average.desc" testId="row-top-tv" />
      </div>
    </div>
  );
}
