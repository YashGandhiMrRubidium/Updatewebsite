import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Play } from "lucide-react";
import { Row } from "@/components/Row";
import { Seo } from "@/components/Seo";
import { NotFound, PageLoader, TitleHero } from "@/components/TitleHero";
import { useApi } from "@/hooks/useApi";
import { fromTmdb, img, tmdbList } from "@/lib/media";
import { pushHistory } from "@/lib/store";
import { AdSlot } from "@/components/AdSlot";

export const SeasonEpisodes = ({ tvId, seasons, season, onSeason, activeEpisode }) => {
  const { data, loading } = useApi(`/tmdb/tv/${tvId}/season/${season}`);
  const valid = (seasons || []).filter((s) => s.season_number > 0);
  return (
    <section data-testid="season-episodes">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-lg font-bold sm:text-xl">Episodes</h2>
        <select value={season} onChange={(e) => onSeason(Number(e.target.value))} data-testid="season-select"
          className="rounded-md border border-white/15 bg-[var(--surface)] px-3 py-1.5 text-sm outline-none focus:border-[var(--brand)]">
          {valid.map((s) => <option key={s.season_number} value={s.season_number}>{s.name || `Season ${s.season_number}`}</option>)}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading && Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-md" />)}
        {(data?.episodes || []).map((ep) => {
          const on = activeEpisode === ep.episode_number;
          return (
            <Link key={ep.id} to={`/watch/tv/${tvId}?s=${season}&e=${ep.episode_number}`} data-testid={`episode-${ep.episode_number}`}
              className={`group flex gap-3 rounded-md border p-2 transition-colors ${on ? "border-[var(--brand)] bg-[var(--brand)]/10" : "border-white/5 bg-[var(--surface)] hover:bg-[var(--surface-2)]"}`}>
              <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded bg-black">
                {ep.still_path && <img src={img(ep.still_path, "w300")} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />}
                <Play size={22} className="absolute inset-0 m-auto fill-white opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Episode {ep.episode_number}</p>
                <p className="line-clamp-1 text-sm font-semibold">{ep.name}</p>
                <p className="line-clamp-2 text-xs text-gray-400">{ep.overview}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

const Cast = ({ cast }) =>
  !cast?.length ? null : (
    <section className="px-4 sm:px-8 lg:px-14" data-testid="cast-section">
      <h2 className="font-display mb-3 text-lg font-bold sm:text-xl">Cast</h2>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {cast.slice(0, 14).map((p) => (
          <div key={p.credit_id} className="w-20 shrink-0 text-center sm:w-24">
            <div className="mx-auto mb-1.5 aspect-square w-full overflow-hidden rounded-full bg-[var(--surface)]">
              {p.profile_path && <img src={img(p.profile_path, "w185")} alt={p.name} loading="lazy" className="h-full w-full object-cover" />}
            </div>
            <p className="line-clamp-1 text-xs font-semibold">{p.name}</p>
            <p className="line-clamp-1 text-[10px] text-gray-500">{p.character}</p>
          </div>
        ))}
      </div>
    </section>
  );

export default function TitlePage({ type }) {
  const { id } = useParams();
  const { data, loading, error } = useApi(`/tmdb/${type}/${id}?append_to_response=credits,recommendations,similar,videos`);
  const [season, setSeason] = useState(1);
  const item = data ? fromTmdb(data, type) : null;

  useEffect(() => {
    if (item) pushHistory(item);
    if (data?.seasons) setSeason(data.seasons.find((s) => s.season_number > 0)?.season_number || 1);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageLoader />;
  if (error || !item) return <NotFound />;
  const recs = tmdbList(data.recommendations, type);
  const similar = recs.length ? recs : tmdbList(data.similar, type);
  const trailer = (data.videos?.results || []).find((v) => v.site === "YouTube" && v.type === "Trailer");
  const meta = type === "movie"
    ? [data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : null]
    : [data.number_of_seasons ? `${data.number_of_seasons} Season${data.number_of_seasons > 1 ? "s" : ""}` : null, data.status];

  return (
    <div data-testid={`title-page-${type}`}>
      <Seo title={`Watch ${item.title}${item.year ? ` (${item.year})` : ""} Online Free in HD`} description={`Watch ${item.title} online free in HD. ${item.overview}`} image={item.backdrop || item.poster} type={type === "movie" ? "video.movie" : "video.tv_show"}
        keywords={`watch ${item.title} online free, ${item.title} full ${type === "movie" ? "movie" : "series"} free, ${item.title} streaming HD, ${item.title} ${item.year}`}
        jsonLd={{ "@context": "https://schema.org", "@type": type === "movie" ? "Movie" : "TVSeries", name: item.title, description: item.overview, image: item.poster, datePublished: data.release_date || data.first_air_date, genre: item.genres,
          ...(data.vote_count ? { aggregateRating: { "@type": "AggregateRating", ratingValue: item.rating, ratingCount: data.vote_count, bestRating: 10 } } : {}) }} />
      <TitleHero item={item} meta={meta} trailerKey={trailer?.key} />
      <div className="space-y-10">
        {type === "tv" && (
          <div className="px-4 sm:px-8 lg:px-14">
            <SeasonEpisodes tvId={id} seasons={data.seasons} season={season} onSeason={setSeason} />
          </div>
        )}
        <AdSlot placement="title_page" className="px-4 sm:px-8 lg:px-14" />
        <Cast cast={data.credits?.cast} />
        <Row title="More Like This" items={similar} testId="row-more-like-this" />
      </div>
    </div>
  );
}
