import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ThumbsDown, EyeOff, Play, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import { cachedGet } from "@/lib/api";
import { tmdbList, watchPath, titlePath } from "@/lib/media";
import { addTaste, topGenres } from "@/lib/vibes";

const DECK = 8;
const ANSWERS = [
  { id: "not", label: "Not for me", icon: ThumbsDown, w: -2, cls: "hover:border-red-500/60 hover:text-red-400" },
  { id: "unseen", label: "Haven't seen", icon: EyeOff, w: 0.5, cls: "hover:border-white/40" },
  { id: "loved", label: "Loved it", icon: Heart, w: 3, cls: "hover:border-[var(--brand)] hover:text-[#ff4d52]" },
];

const SwipeCard = ({ item, onAnswer }) => {
  const [dx, setDx] = useState(0);
  const start = useRef(null);
  const up = () => {
    if (dx > 90) onAnswer("loved");
    else if (dx < -90) onAnswer("not");
    start.current = null;
    setDx(0);
  };
  return (
    <div onPointerDown={(e) => (start.current = e.clientX)} onPointerMove={(e) => start.current !== null && setDx(e.clientX - start.current)}
      onPointerUp={up} onPointerLeave={() => start.current !== null && up()} data-testid="decider-card"
      style={{ transform: `translateX(${dx}px) rotate(${dx / 18}deg)`, transition: start.current === null ? "transform .3s" : "none", touchAction: "pan-y" }}
      className="poster-in relative aspect-[2/3] w-full cursor-grab overflow-hidden rounded-2xl bg-[var(--surface)] shadow-2xl ring-1 ring-white/10">
      {item.poster && <img src={item.poster.replace("w342", "w500")} alt={item.title} draggable={false} className="h-full w-full object-cover" />}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 pt-16">
        <p className="font-display text-xl font-bold">{item.title}</p>
        <p className="text-xs text-gray-400">{item.year} · ★ {item.rating}</p>
      </div>
      {dx > 40 && <span className="absolute left-4 top-4 rotate-[-12deg] rounded border-2 border-[#46d369] px-2 text-lg font-black text-[#46d369]">LOVED</span>}
      {dx < -40 && <span className="absolute right-4 top-4 rotate-[12deg] rounded border-2 border-red-500 px-2 text-lg font-black text-red-500">NOPE</span>}
    </div>
  );
};

export const Decider = () => {
  const [type, setType] = useState("movie");
  const [phase, setPhase] = useState("idle");
  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState([]);
  const [pi, setPi] = useState(0);

  const start = async () => {
    setPhase("loading");
    const page = 1 + Math.floor(Math.random() * 3);
    const [a, b] = await Promise.all([cachedGet(`/tmdb/${type}/popular?page=${page}`), cachedGet(`/tmdb/${type}/top_rated?page=${page}`)]);
    const all = [...tmdbList(a, type), ...tmdbList(b, type)].filter((x) => x.poster);
    setDeck(all.sort(() => Math.random() - 0.5).slice(0, DECK));
    setIdx(0);
    setPhase("swipe");
  };

  const reveal = async (seen) => {
    setPhase("loading");
    const g = topGenres(type, 2);
    const d = await cachedGet(`/tmdb/discover/${type}?sort_by=popularity.desc&vote_average.gte=6.5&vote_count.gte=300${g.length ? `&with_genres=${g.join("|")}` : ""}`);
    const list = tmdbList(d, type).filter((x) => !seen.has(x.id) && x.backdrop);
    setPicks(list);
    setPi(0);
    setPhase("reveal");
  };

  const answer = (id) => {
    const item = deck[idx];
    addTaste(type, item.genreIds, ANSWERS.find((a) => a.id === id).w);
    if (idx + 1 >= deck.length) reveal(new Set(deck.map((x) => x.id)));
    else setIdx(idx + 1);
  };
  const pick = picks[pi % Math.max(picks.length, 1)];

  return (
    <section id="decider" className="relative mx-4 overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#16090b] via-[#0f0f13] to-[#0a0a0c] sm:mx-8 lg:mx-14" data-testid="decider-section">
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[var(--brand)]/10 blur-3xl" />
      <div className="relative grid items-center gap-10 p-6 sm:p-10 lg:grid-cols-2 lg:p-14">
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-[#ff4d52]">The Decider</p>
          <h2 className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl">
            Can't decide?<br /><span className="italic text-[var(--brand)]">Let us.</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-400 sm:text-base">
            Swipe through titles you know — <Heart size={14} className="inline fill-[var(--brand)] text-[var(--brand)]" /> loved it, <ThumbsDown size={14} className="inline text-gray-300" /> not for me, or <EyeOff size={14} className="inline text-gray-300" /> haven't seen. We'll figure out what you actually want to watch — and your feed learns your taste.
          </p>
          <div className="mt-6 grid max-w-md grid-cols-2 gap-3">
            {[["movie", "Movies"], ["tv", "TV Shows"]].map(([v, l]) => (
              <button key={v} onClick={() => { setType(v); setPhase("idle"); }} data-testid={`decider-type-${v}`}
                className={`rounded-lg border py-3 text-sm font-semibold transition-colors ${type === v ? "border-[var(--brand)] bg-[var(--brand)]/15 text-white" : "border-white/10 text-gray-400 hover:text-white"}`}>{l}</button>
            ))}
          </div>
          {phase !== "swipe" && (
            <button onClick={start} disabled={phase === "loading"} className="btn-primary mt-4 flex items-center gap-2 rounded-lg px-6 py-3 font-bold disabled:opacity-60" data-testid="decider-start-button">
              {phase === "reveal" ? <><RotateCcw size={18} /> Start over</> : <><Play size={18} className="fill-current" /> Start The Decider</>}
            </button>
          )}
          {phase === "swipe" && <p className="mt-4 text-xs text-gray-500" data-testid="decider-progress">Card {idx + 1} of {deck.length} · swipe or tap a button</p>}
        </div>
        <div className="mx-auto w-full max-w-[210px] sm:max-w-[300px]">
          {(phase === "idle" || phase === "loading") && (
            <div className="relative aspect-[2/3] w-full">
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border border-white/5 bg-white/[0.02]" />
              <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-2xl border border-white/5 bg-white/[0.03]" />
              <div className={`absolute inset-0 flex items-center justify-center rounded-2xl border border-white/10 bg-[var(--surface)] text-sm text-[#ff4d52] ${phase === "loading" ? "skeleton" : ""}`}>
                {phase === "idle" && <span className="flex items-center gap-2"><Sparkles size={16} /> Start to reveal your pick</span>}
              </div>
            </div>
          )}
          {phase === "swipe" && deck[idx] && (
            <>
              <SwipeCard key={deck[idx].id} item={deck[idx]} onAnswer={answer} />
              <div className="mt-4 grid grid-cols-3 gap-2">
                {ANSWERS.map(({ id, label, icon: Icon, cls }) => (
                  <button key={id} onClick={() => answer(id)} data-testid={`decider-${id}`}
                    className={`flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-black/30 py-2 text-[11px] text-gray-300 transition-colors ${cls}`}>
                    <Icon size={18} /> {label}
                  </button>
                ))}
              </div>
            </>
          )}
          {phase === "reveal" && pick && (
            <div className="poster-in overflow-hidden rounded-2xl bg-[var(--surface)] ring-1 ring-[var(--brand)]/40" data-testid="decider-pick">
              <img src={pick.backdrop} alt={pick.title} className="aspect-video w-full object-cover" />
              <div className="space-y-2 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#ff4d52]">Your pick</p>
                <Link to={titlePath(pick)} className="font-display block text-xl font-bold hover:underline" data-testid="decider-pick-title">{pick.title}</Link>
                <p className="line-clamp-3 text-xs text-gray-400">{pick.overview}</p>
                <div className="flex gap-2 pt-1">
                  <Link to={watchPath(pick)} className="btn-primary flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-bold" data-testid="decider-pick-play"><Play size={15} className="fill-current" /> Play</Link>
                  <button onClick={() => setPi(pi + 1)} className="btn-ghost flex items-center gap-1.5 rounded-md px-3 text-sm" data-testid="decider-another"><Shuffle size={15} /> Another</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
