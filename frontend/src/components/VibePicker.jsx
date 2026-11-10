import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SectionHead } from "@/components/Row";
import { VIBES } from "@/lib/vibes";

export const VibeChip = ({ v, active, onClick, to }) => {
  const Icon = v.icon;
  const cls = "flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-[transform,box-shadow,background-color] hover:-translate-y-0.5";
  const style = active
    ? { background: v.color, borderColor: v.color, color: "#fff", boxShadow: `0 8px 30px -6px ${v.color}` }
    : { background: `${v.color}12`, borderColor: `${v.color}40`, color: v.color };
  const inner = <><Icon size={17} /> {v.name}</>;
  return to
    ? <Link to={to} className={cls} style={style} data-testid={`vibe-${v.id}`}>{inner}</Link>
    : <button onClick={onClick} className={cls} style={style} data-testid={`vibe-${v.id}`}>{inner}</button>;
};

export const VibePicker = () => (
  <section data-testid="vibe-picker">
    <SectionHead eyebrow="Picked for tonight" title="Pick your vibe" subtitle="Tell us your mood, we'll line up the perfect watch." />
    <div className="flex flex-wrap gap-2.5 px-4 sm:px-8 lg:px-14">
      {VIBES.map((v) => <VibeChip key={v.id} v={v} to={`/discover?vibe=${v.id}`} />)}
    </div>
    <p className="mt-4 px-4 text-sm text-gray-500 sm:px-8 lg:px-14">
      Can't decide?{" "}
      <button onClick={() => document.getElementById("decider")?.scrollIntoView({ behavior: "smooth", block: "center" })}
        className="inline-flex items-center gap-1 border-b border-dashed border-gray-500 text-gray-300 hover:text-white" data-testid="vibe-decider-link">
        Let The Decider pick for you <ArrowRight size={13} />
      </button>
    </p>
  </section>
);
