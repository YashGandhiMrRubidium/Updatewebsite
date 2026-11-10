import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { SectionHead } from "@/components/Row";
import { api } from "@/lib/api";
import { titlePath } from "@/lib/media";

export const LiveNow = () => {
  const [items, setItems] = useState(null);
  useEffect(() => {
    const load = () => api.get("/live").then((r) => setItems(r.data)).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);
  if (items && !items.length) return null;
  return (
    <section data-testid="live-now-section">
      <SectionHead eyebrow="Live" title="Right Now" subtitle="who's watching and what keeps coming up" />
      <div className="no-scrollbar flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-4 sm:scroll-px-8 sm:px-8 lg:scroll-px-14 lg:px-14">
        {!items && Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton aspect-video w-[72vw] shrink-0 rounded-lg sm:w-[320px]" />)}
        {items?.map((it, i) => (
          <Link key={`${it.type}-${it.id}`} to={titlePath(it)} data-testid={`live-item-${it.type}-${it.id}`} style={{ animationDelay: `${i * 50}ms` }}
            className="poster-in group relative aspect-video w-[72vw] shrink-0 snap-start overflow-hidden rounded-lg ring-1 ring-white/10 sm:w-[320px]">
            {(it.backdrop || it.poster) && <img src={it.backdrop || it.poster} alt={it.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded bg-[var(--brand)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
            </span>
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="font-display line-clamp-1 font-bold">{it.title}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-300" data-testid={`live-count-${it.type}-${it.id}`}>
                <Eye size={13} className="text-[#46d369]" /> <b className="tabular-nums text-white">{it.watching}</b> watching now
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
