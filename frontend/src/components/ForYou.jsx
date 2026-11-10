import { ApiRow } from "@/components/Row";
import { useStored } from "@/lib/store";
import { tmdbList } from "@/lib/media";
import { topGenres } from "@/lib/vibes";

export const ForYouRow = ({ type }) => {
  const [history] = useStored("cs:history", []);
  const [taste] = useStored("cs:taste", {});
  const [list] = useStored("cs:mylist", []);
  const genres = topGenres(type, 2);
  if (!genres.length) return null;
  const seen = new Set([...history, ...list].filter((h) => h.type === type).map((h) => h.id));
  const url = `/tmdb/discover/${type}?with_genres=${genres.join("|")}&sort_by=popularity.desc&vote_count.gte=150`;
  const map = (d) => tmdbList(d, type).filter((x) => !seen.has(x.id));
  const sig = `${genres.join()}-${Object.keys(taste).length}`;
  return (
    <ApiRow key={sig} url={url} map={map} testId={`row-for-you-${type}`}
      title={type === "movie" ? "Top Picks For You" : "Series Picked For You"}
      subtitle="Based on what you watch, like and rate" />
  );
};
