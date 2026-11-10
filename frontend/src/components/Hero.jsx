import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Info, Plus, Check, Flame, Star } from "lucide-react";
import { toast } from "sonner";
import { ShareButton } from "@/components/ShareButton";
import { titlePath, watchPath } from "@/lib/media";
import { keyOf, useMyList } from "@/lib/store";

export const Hero = ({ items, loading }) => {
  const [i, setI] = useState(0);
  const { has, toggle } = useMyList();
  const list = (items || []).filter((x) => x.backdrop).slice(0, 6);

  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % list.length), 9000);
    return () => clearInterval(t);
  }, [list.length]);

  if (loading || !list.length) return <div className="skeleton h-[72vh] w-full sm:h-[88vh]" data-testid="hero-loading" />;
  const it = list[i % list.length];
  const saved = has(it);

  return (
    <section className="relative h-[72vh] w-full overflow-hidden sm:h-[88vh]" data-testid="hero-banner">
      {list.map((x, idx) => (
        <img key={keyOf(x)} src={x.backdrop} alt="" loading={idx === 0 ? "eager" : "lazy"} fetchpriority={idx === 0 ? "high" : "low"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${idx === i ? "hero-kenburns opacity-100" : "opacity-0"}`} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent" />
      <div key={i} className="relative z-10 flex h-full max-w-3xl flex-col justify-end gap-4 px-4 pb-16 sm:px-8 sm:pb-24 lg:px-14">
        <div className="fade-up flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[var(--brand)]">
          <Flame size={14} /> #{i + 1} Trending today
        </div>
        <h1 className="fade-up fade-up-2 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl" data-testid="hero-title">{it.title}</h1>
        <div className="fade-up fade-up-2 flex items-center gap-3 text-sm text-gray-300">
          {it.rating && <span className="flex items-center gap-1 font-semibold text-[#46d369]"><Star size={13} className="fill-current" /> {it.rating}</span>}
          {it.year && <span>{it.year}</span>}
          <span className="rounded border border-white/30 px-1.5 text-[10px] uppercase tracking-wider">{it.type === "tv" ? "Series" : it.type}</span>
        </div>
        <p className="fade-up fade-up-3 line-clamp-3 max-w-xl text-sm text-gray-300 sm:text-base">{it.overview}</p>
        <div className="fade-up fade-up-4 flex flex-wrap items-center gap-2 sm:gap-3">
          <Link to={watchPath(it)} className="flex items-center gap-2 rounded-md bg-white px-5 py-2.5 font-bold text-black transition-transform hover:scale-[1.03] hover:bg-white/85 sm:px-7" data-testid="hero-play-button">
            <Play size={20} className="fill-current" /> Play
          </Link>
          <Link to={titlePath(it)} className="btn-ghost flex items-center gap-2 rounded-md px-5 py-2.5 font-semibold sm:px-6" data-testid="hero-info-button">
            <Info size={20} /> More Info
          </Link>
          <button onClick={() => toast.success(toggle(it) ? "Added to My List" : "Removed from My List")} aria-label="My List"
            className="btn-ghost flex h-11 w-11 items-center justify-center rounded-full" data-testid="hero-mylist-button">
            {saved ? <Check size={20} /> : <Plus size={20} />}
          </button>
          <ShareButton title={it.title} url={`${window.location.origin}${titlePath(it)}`} iconOnly testId="hero-share-button"
            className="btn-ghost flex h-11 w-11 items-center justify-center rounded-full" />
        </div>
      </div>
      <div className="absolute bottom-20 right-4 z-10 flex gap-1.5 sm:bottom-28 sm:right-14">
        {list.map((x, idx) => (
          <button key={keyOf(x)} onClick={() => setI(idx)} aria-label={`Slide ${idx + 1}`} data-testid={`hero-dot-${idx}`}
            className={`h-1 rounded-full transition-[width,background-color] duration-500 ${idx === i ? "w-8 bg-[var(--brand)]" : "w-3 bg-white/40"}`} />
        ))}
      </div>
    </section>
  );
};
