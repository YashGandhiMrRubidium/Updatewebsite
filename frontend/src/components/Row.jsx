import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PosterCard } from "@/components/PosterCard";
import { useApi, useInView } from "@/hooks/useApi";
import { keyOf } from "@/lib/store";

const W = "w-[31vw] sm:w-[150px] lg:w-[180px] xl:w-[195px]";
const PAD = "px-4 sm:px-8 lg:px-14";

export const Row = ({ title, subtitle, items, loading, to, testId }) => {
  const ref = useRef(null);
  const scroll = (d) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.85, behavior: "smooth" });
  if (!loading && !items?.length) return null;
  return (
    <section className="relative" data-testid={testId}>
      <div className={`mb-2 flex items-end justify-between ${PAD}`}>
        <div>
          <h2 className="font-display text-base font-bold sm:text-lg lg:text-xl">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {to && (
          <Link to={to} className="flex items-center gap-0.5 text-xs text-gray-400 transition-colors hover:text-white" data-testid={`${testId}-see-all`}>
            See all <ChevronRight size={14} />
          </Link>
        )}
      </div>
      <div className="group/row relative">
        {[-1, 1].map((d) => (
          <button key={d} onClick={() => scroll(d)} aria-label={d < 0 ? "Scroll left" : "Scroll right"} data-testid={`${testId}-${d < 0 ? "prev" : "next"}`}
            className={`absolute ${d < 0 ? "left-0" : "right-0"} top-0 z-20 hidden h-[calc(100%-1rem)] w-12 items-center justify-center bg-black/50 opacity-0 transition-opacity hover:bg-black/70 group-hover/row:opacity-100 md:flex`}>
            {d < 0 ? <ChevronLeft size={30} /> : <ChevronRight size={30} />}
          </button>
        ))}
        <div ref={ref} className={`no-scrollbar flex snap-x gap-2 overflow-x-auto pb-4 pt-1 sm:gap-3 ${PAD}`}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <div key={i} className={`skeleton aspect-[2/3] shrink-0 rounded-md ${W}`} />)
            : items.map((it, i) => <PosterCard key={keyOf(it)} item={it} index={i} className={`snap-start ${W}`} />)}
        </div>
      </div>
    </section>
  );
};

export const ApiRow = ({ url, map, ...rest }) => {
  const [ref, inView] = useInView();
  const { data, loading } = useApi(inView ? url : null);
  return (
    <div ref={ref} className="min-h-[200px]">
      <Row {...rest} items={data ? map(data) : []} loading={!inView || loading} />
    </div>
  );
};
