import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";
import { titlePath } from "@/lib/media";
import { useMyList } from "@/lib/store";

export const PosterCard = ({ item, index = 0, className = "" }) => {
  const { has, toggle } = useMyList();
  const saved = has(item);
  const tid = `${item.type}-${item.id}`;
  const onLike = () => toast.success(toggle(item) ? "Added to My List" : "Removed from My List");

  return (
    <div className={`poster-in group relative shrink-0 ${className}`} style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }} data-testid={`poster-${tid}`}>
      <Link to={titlePath(item)} className="relative block aspect-[2/3] overflow-hidden rounded-md bg-[var(--surface)] ring-1 ring-white/5 transition-[box-shadow,transform] duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_-12px_rgba(229,9,20,0.45)]" data-testid={`poster-link-${tid}`}>
        {item.poster ? (
          <img src={item.poster} alt={item.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-sm text-gray-400">{item.title}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute inset-x-0 bottom-0 translate-y-3 p-2.5 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="font-display line-clamp-2 text-sm font-semibold leading-tight">{item.title}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-300">
            {item.rating && <span className="flex items-center gap-0.5 font-semibold text-[#46d369]"><Star size={10} className="fill-current" />{item.rating}</span>}
            {item.year && <span>{item.year}</span>}
            <span className="rounded-sm border border-white/30 px-1 text-[9px] uppercase tracking-wider">{item.type}</span>
          </div>
        </div>
      </Link>
      <button onClick={onLike} aria-label="Add to My List" data-testid={`like-${tid}`}
        className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 backdrop-blur transition-[opacity,transform] hover:scale-110 md:opacity-0 md:group-hover:opacity-100">
        <Heart size={15} className={saved ? "fill-[var(--brand)] text-[var(--brand)]" : "text-white"} />
      </button>
    </div>
  );
};
