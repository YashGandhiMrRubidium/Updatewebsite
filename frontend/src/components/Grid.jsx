import { PosterCard } from "@/components/PosterCard";
import { keyOf } from "@/lib/store";

export const Grid = ({ items, loading, testId = "results-grid", count = 18 }) => (
  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7" data-testid={testId}>
    {items.map((it, i) => <PosterCard key={keyOf(it)} item={it} index={i % 18} />)}
    {loading && Array.from({ length: count }).map((_, i) => <div key={`s${i}`} className="skeleton aspect-[2/3] rounded-md" />)}
  </div>
);

export const Chips = ({ options, value, onChange, testPrefix }) => (
  <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
    {options.map(([v, label]) => {
      const on = String(v) === String(value);
      return (
        <button key={v} onClick={() => onChange(on ? "" : v)} data-testid={`${testPrefix}-${String(v).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-[background-color,border-color,color] sm:text-sm ${on ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-white/15 text-gray-300 hover:border-white/40 hover:text-white"}`}>
          {label}
        </button>
      );
    })}
  </div>
);
