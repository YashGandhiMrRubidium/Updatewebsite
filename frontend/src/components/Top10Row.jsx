import { Link } from "react-router-dom";
import { useApi, useInView } from "@/hooks/useApi";
import { titlePath } from "@/lib/media";

export const Top10Row = ({ type, title }) => {
  const [ref, inView] = useInView();
  const { data } = useApi(inView ? `/top10?type=${type}` : null);
  return (
    <section ref={ref} className="min-h-[220px]" data-testid={`top10-${type}`}>
      <h2 className="font-display mb-2 flex items-baseline gap-2 px-4 text-base font-bold sm:px-8 sm:text-lg lg:px-14 lg:text-xl">
        <span className="rounded bg-[var(--brand)] px-1.5 text-sm font-black">TOP 10</span> {title}
      </h2>
      <div className="no-scrollbar flex snap-x scroll-px-4 gap-1 overflow-x-auto px-4 pb-4 sm:scroll-px-8 sm:px-8 lg:scroll-px-14 lg:px-14">
        {!data && Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton aspect-[3/2] w-[48vw] shrink-0 rounded-md sm:w-[240px]" />)}
        {data?.map((it, i) => (
          <Link key={`${it.type}-${it.id}`} to={titlePath(it)} className="group flex shrink-0 snap-start items-end" data-testid={`top10-${type}-item-${i + 1}`}>
            <span className="top10-num font-display -mr-4 select-none text-[110px] font-black leading-[0.8] sm:-mr-5 sm:text-[150px]">{i + 1}</span>
            <div className="relative aspect-[2/3] w-[28vw] overflow-hidden rounded-md bg-[var(--surface)] ring-1 ring-white/5 transition-transform duration-300 group-hover:-translate-y-1 sm:w-[130px] lg:w-[150px]">
              {it.poster && <img src={it.poster} alt={it.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
