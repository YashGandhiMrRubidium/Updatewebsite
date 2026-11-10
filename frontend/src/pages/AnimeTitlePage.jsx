import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Row } from "@/components/Row";
import { Seo } from "@/components/Seo";
import { NotFound, PageLoader, TitleHero } from "@/components/TitleHero";
import { useApi } from "@/hooks/useApi";
import { fromAni } from "@/lib/media";
import { pushHistory } from "@/lib/store";

export const EpisodeGrid = ({ animeId, total, active, lang = "sub" }) => (
  <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12" data-testid="anime-episode-grid">
    {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
      <Link key={n} to={`/watch/anime/${animeId}?ep=${n}&lang=${lang}`} data-testid={`anime-episode-${n}`}
        className={`rounded-md border py-2 text-center text-sm font-semibold transition-colors ${active === n ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-white/10 bg-[var(--surface)] text-gray-300 hover:border-white/30 hover:text-white"}`}>
        {n}
      </Link>
    ))}
  </div>
);

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
  const total = data.episodes || 12;
  const meta = [data.format, data.episodes ? `${data.episodes} Episodes` : "Ongoing", data.studios?.nodes?.[0]?.name];

  return (
    <div data-testid="title-page-anime">
      <Seo title={`Watch ${item.title} Anime`} description={item.overview} image={item.backdrop || item.poster} type="video.tv_show" />
      <TitleHero item={item} meta={meta} />
      <div className="space-y-10">
        <section className="px-4 sm:px-8 lg:px-14">
          <h2 className="font-display mb-4 text-lg font-bold sm:text-xl">Episodes</h2>
          <EpisodeGrid animeId={id} total={total} />
        </section>
        <Row title="More Like This" items={recsOf(data)} testId="row-more-like-this" />
      </div>
    </div>
  );
}
