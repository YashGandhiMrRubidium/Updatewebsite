import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Row } from "@/components/Row";
import { Seo } from "@/components/Seo";
import { ShareButton } from "@/components/ShareButton";
import { NotFound, PageLoader } from "@/components/TitleHero";
import { WatchPlayer } from "@/components/WatchPlayer";
import { useApi } from "@/hooks/useApi";
import { fromAni, fromTmdb, titlePath, tmdbList } from "@/lib/media";
import { pushHistory } from "@/lib/store";
import { SeasonEpisodes } from "@/pages/TitlePage";
import { EpisodeGrid, recsOf } from "@/pages/AnimeTitlePage";

const StepBtn = ({ disabled, onClick, dir, testId }) => (
  <button disabled={disabled} onClick={onClick} data-testid={testId}
    className="btn-ghost flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40">
    {dir < 0 ? <><ChevronLeft size={16} /> Prev</> : <>Next <ChevronRight size={16} /></>}
  </button>
);

export default function WatchPage({ type }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const url = type === "anime" ? `/anime/${id}` : `/tmdb/${type}/${id}?append_to_response=recommendations`;
  const { data, loading, error } = useApi(url);
  const season = Number(params.get("s") || 1);
  const episode = Number(params.get(type === "anime" ? "ep" : "e") || 1);
  const lang = params.get("lang") === "dub" ? "dub" : "sub";
  const item = data ? (type === "anime" ? fromAni(data) : fromTmdb(data, type)) : null;
  const media = useMemo(() => ({ type, id, season, episode, lang }), [type, id, season, episode, lang]);

  useEffect(() => {
    if (item) pushHistory(item);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageLoader />;
  if (error || !item) return <NotFound />;

  const setQ = (patch) => setParams({ ...Object.fromEntries(params), ...patch });
  const totalAnime = data.episodes || 12;
  const seasonMax = type === "tv" ? data.seasons?.find((s) => s.season_number === season)?.episode_count || 1 : totalAnime;
  const sub = type === "movie" ? item.year : type === "tv" ? `Season ${season} · Episode ${episode}` : `Episode ${episode} · ${lang.toUpperCase()}`;
  const recs = type === "anime" ? recsOf(data) : tmdbList(data.recommendations, type);
  const epKey = type === "anime" ? "ep" : "e";

  return (
    <div className="pt-16 sm:pt-20" data-testid={`watch-page-${type}`}>
      <Seo title={`Watching ${item.title}${type === "movie" ? "" : ` – ${sub}`}`} description={item.overview} image={item.backdrop || item.poster} />
      <div className="px-4 sm:px-8 lg:px-14">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => navigate(titlePath(item))} className="rounded-full bg-white/5 p-2.5 transition-colors hover:bg-white/15" aria-label="Back" data-testid="watch-back-button">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <Link to={titlePath(item)} className="font-display line-clamp-1 text-xl font-bold hover:underline sm:text-2xl lg:text-3xl" data-testid="watch-title">{item.title}</Link>
            <p className="text-xs text-gray-400 sm:text-sm" data-testid="watch-subtitle">{sub}</p>
          </div>
          <ShareButton title={item.title} url={`${window.location.origin}${titlePath(item)}`} testId="watch-share-button"
            className="btn-ghost flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" />
        </div>
        <div className="mx-auto max-w-6xl">
          <WatchPlayer media={media} title={item.title} />
          {type !== "movie" && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <StepBtn dir={-1} disabled={episode <= 1} onClick={() => setQ({ [epKey]: episode - 1 })} testId="prev-episode-button" />
              <StepBtn dir={1} disabled={episode >= seasonMax} onClick={() => setQ({ [epKey]: episode + 1 })} testId="next-episode-button" />
              {type === "anime" && (
                <div className="ml-auto flex gap-1 rounded-full bg-white/5 p-1" data-testid="audio-toggle">
                  {["sub", "dub"].map((l) => (
                    <button key={l} onClick={() => setQ({ lang: l })} data-testid={`audio-${l}`}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase transition-colors ${lang === l ? "bg-[var(--primary)] text-white" : "text-gray-400 hover:text-white"}`}>{l}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mx-auto mt-8 max-w-6xl">
          {type === "tv" && <SeasonEpisodes tvId={id} seasons={data.seasons} season={season} onSeason={(s) => setQ({ s, e: 1 })} activeEpisode={episode} />}
          {type === "anime" && (
            <>
              <h2 className="font-display mb-4 text-lg font-bold">Episodes</h2>
              <EpisodeGrid animeId={id} total={totalAnime} active={episode} lang={lang} />
            </>
          )}
          {item.overview && type === "movie" && (
            <div>
              <h2 className="font-display mb-2 text-lg font-bold">About</h2>
              <p className="text-sm leading-relaxed text-gray-400">{item.overview}</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-10">
        <Row title="More Like This" items={recs} testId="row-more-like-this" />
      </div>
    </div>
  );
}
