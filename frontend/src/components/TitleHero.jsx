import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Plus, Check, Star, Youtube } from "lucide-react";
import { toast } from "sonner";
import { ShareButton } from "@/components/ShareButton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { titlePath, watchPath } from "@/lib/media";
import { useMyList } from "@/lib/store";

export const TitleHero = ({ item, meta = [], trailerKey, playTo }) => {
  const { has, toggle } = useMyList();
  const [trailer, setTrailer] = useState(false);
  const saved = has(item);
  return (
    <section className="relative min-h-[78vh] w-full overflow-hidden" data-testid="title-hero">
      {item.backdrop && <img src={item.backdrop} alt="" className="hero-kenburns absolute inset-0 h-full w-full object-cover" fetchpriority="high" />}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/80 to-[#0a0a0c]/20" />
      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/70 to-transparent" />
      <div className="relative z-10 flex min-h-[78vh] items-end gap-8 px-4 pb-10 pt-24 sm:px-8 lg:px-14">
        {item.poster && <img src={item.poster} alt={item.title} className="fade-up hidden w-56 shrink-0 rounded-lg shadow-2xl ring-1 ring-white/10 md:block lg:w-64" />}
        <div className="max-w-2xl space-y-4">
          <span className="fade-up inline-block rounded bg-[var(--brand)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#ff4d52]">
            {item.type === "tv" ? "Series" : item.type}
          </span>
          <h1 className="fade-up fade-up-2 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl" data-testid="title-name">{item.title}</h1>
          <div className="fade-up fade-up-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-300">
            {item.rating && <span className="flex items-center gap-1 font-semibold text-[#46d369]"><Star size={13} className="fill-current" />{item.rating}</span>}
            {item.year && <span>{item.year}</span>}
            {meta.filter(Boolean).map((m) => <span key={m}>{m}</span>)}
          </div>
          {!!item.genres?.length && (
            <div className="fade-up fade-up-3 flex flex-wrap gap-1.5">
              {item.genres.slice(0, 5).map((g) => <span key={g} className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-gray-300">{g}</span>)}
            </div>
          )}
          <p className="fade-up fade-up-3 line-clamp-5 text-sm leading-relaxed text-gray-300 sm:text-base" data-testid="title-overview">{item.overview}</p>
          <div className="fade-up fade-up-4 flex flex-wrap items-center gap-2 pt-1 sm:gap-3">
            <Link to={playTo || watchPath(item)} className="btn-primary flex items-center gap-2 rounded-md px-6 py-2.5 font-bold" data-testid="title-play-button">
              <Play size={20} className="fill-current" /> Play
            </Link>
            <button onClick={() => toast.success(toggle(item) ? "Added to My List" : "Removed from My List")}
              className="btn-ghost flex items-center gap-2 rounded-md px-5 py-2.5 font-semibold" data-testid="title-mylist-button">
              {saved ? <Check size={18} /> : <Plus size={18} />} My List
            </button>
            {trailerKey && (
              <button onClick={() => setTrailer(true)} className="btn-ghost flex items-center gap-2 rounded-md px-5 py-2.5 font-semibold" data-testid="title-trailer-button">
                <Youtube size={18} /> Trailer
              </button>
            )}
            <ShareButton title={item.title} url={`${window.location.origin}${titlePath(item)}`} testId="title-share-button"
              className="btn-ghost flex items-center gap-2 rounded-md px-5 py-2.5 font-semibold" />
          </div>
        </div>
      </div>
      {trailerKey && (
        <Dialog open={trailer} onOpenChange={setTrailer}>
          <DialogContent className="max-w-4xl border-white/10 bg-black p-0">
            <DialogTitle className="sr-only">Trailer</DialogTitle>
            <div className="aspect-video w-full">
              {trailer && <iframe className="h-full w-full rounded-lg" src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`} title="Trailer" allow="autoplay; encrypted-media; fullscreen" allowFullScreen />}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
};

export const PageLoader = () => (
  <div className="px-4 pt-24 sm:px-8 lg:px-14">
    <div className="skeleton mb-6 h-[50vh] w-full rounded-lg" />
    <div className="skeleton mb-3 h-8 w-1/3 rounded" />
    <div className="skeleton h-4 w-2/3 rounded" />
  </div>
);

export const NotFound = ({ text = "We couldn't find that title." }) => (
  <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center" data-testid="not-found">
    <p className="font-display text-6xl font-black text-[var(--brand)]">404</p>
    <p className="text-gray-400">{text}</p>
    <Link to="/" className="btn-primary rounded-md px-5 py-2 font-semibold" data-testid="not-found-home">Back to Home</Link>
  </div>
);
