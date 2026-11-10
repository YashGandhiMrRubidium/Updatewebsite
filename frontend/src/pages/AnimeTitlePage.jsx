import { useEffect, useState } from "react";
import { AdSlot } from "@/components/AdSlot";
import { Link, useParams } from "react-router-dom";
import { Row } from "@/components/Row";
import { Seo } from "@/components/Seo";
import { NotFound, PageLoader, TitleHero } from "@/components/TitleHero";
import { useApi } from "@/hooks/useApi";
import { fromAni } from "@/lib/media";
import { pushHistory } from "@/lib/store";

const CHUNK = 100;

export const EpisodeGrid = ({ animeId, total, active = 1, lang = "sub" }) => {
  const [chunk, setChunk] = useState(Math.floor((active - 1) / CHUNK));
  const chunks = Math.ceil(total / CHUNK);
  const startN = chunk * CHUNK + 1;
  return (
  <>
  {chunks > 1 && (
    <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto" data-testid="episode-range-tabs">
      {Array.from({ length: chunks }, (_, c) => (
        <button key={c} onClick={() => setChunk(c)} data-testid={`episode-range-${c}`}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${c === chunk ? "bg-white text-black" : "bg-white/5 text-gray-400 hover:text-white"}`}>
          {c * CHUNK + 1}–{Math.min(total, (c + 1) * CHUNK)}
        </button>
      ))}
    </div>
  )}
  <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12" data-testid="anime-episode-grid">
    {Array.from({ length: Math.min(CHUNK, total - startN + 1) }, (_, i) => startN + i).map((n) => (
      <Link key={n} to={`/watch/anime/${animeId}?ep=${n}&lang=${lang}`} data-testid={`anime-episode-${n}`}
        className={`rounded-md border py-2 text-center text-sm font-semibold transition-colors ${active === n ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-white/10 bg-[var(--surface)] text-gray-300 hover:border-white/30 hover:text-white"}`}>
        {n}
      </Link>
    ))}
  </div>
  </>
  );
};

export const recsOf = (m) => (m?.recommendations?.nodes || []).map((n) => n.mediaRecommendation).filter(Boolean).map(fromAni);

export default function AnimeTitlePage() {
  const { id } = useParams();
  const { data, loading, error } = useApi(`/anime/${id}`);
  const item = data ? fromAni(data) : null;
  useEffect(() => {
    if (item) pushHistory(item);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageLoader />;
  if (error || !item) return <NotFound />;
  const total = item.episodes || 12;
  const meta = [data.format, data.episodes ? `${data.episodes} Episodes` : "Ongoing", data.studios?.nodes?.[0]?.name];

  return (
    <div data-testid="title-page-anime">
      <Seo title={`Watch ${item.title} Anime Online Free (Sub & Dub)`} description={`Watch ${item.title} anime online free in HD, English sub and dub. ${item.overview}`} image={item.backdrop || item.poster} type="video.tv_show"
        keywords={`watch ${item.title} online free, ${item.title} english dub, ${item.title} english sub, ${item.title} all episodes`}
        jsonLd={{ "@context": "https://schema.org", "@type": "TVSeries", name: item.title, description: item.overview, image: item.poster, genre: item.genres, numberOfEpisodes: item.episodes || undefined }} />
      <TitleHero item={item} meta={meta} />
      <div className="space-y-10">
        <section className="px-4 sm:px-8 lg:px-14">
          <h2 className="font-display mb-4 text-lg font-bold sm:text-xl">Episodes</h2>
          <EpisodeGrid animeId={id} total={total} />
        </section>
        <AdSlot placement="title_page" className="px-4 sm:px-8 lg:px-14" />
        <Row title="More Like This" items={recsOf(data)} testId="row-more-like-this" />
      </div>
    </div>
  );
}
