import { Flame, CloudRain, Ghost, HeartHandshake, Brain, Laugh, Moon, Compass } from "lucide-react";
import { read, write } from "@/lib/store";

// genres: [movieGenres, tvGenres] joined with "|" (OR) for TMDB discover
export const VIBES = [
  { id: "hyped", name: "Hyped", tag: "Action-packed · High energy", icon: Flame, color: "#f97316", genres: ["28|12", "10759"] },
  { id: "melancholy", name: "Melancholy", tag: "Deep feelings · Slow burn", icon: CloudRain, color: "#a855f7", genres: ["18", "18"] },
  { id: "terrified", name: "Terrified", tag: "Screams · Suspense", icon: Ghost, color: "#ef4444", genres: ["27|53", "9648|80"] },
  { id: "romantic", name: "Romantic", tag: "Love stories · Butterflies", icon: HeartHandshake, color: "#ec4899", genres: ["10749", "18|35"] },
  { id: "mindblown", name: "Mindblown", tag: "Twists · Big ideas", icon: Brain, color: "#06b6d4", genres: ["878|9648", "10765"] },
  { id: "funny", name: "Funny", tag: "Laugh out loud", icon: Laugh, color: "#eab308", genres: ["35", "35"] },
  { id: "chill", name: "Chill", tag: "Cozy · Easy watching", icon: Moon, color: "#22c55e", genres: ["10751|16", "10751|16"] },
  { id: "curious", name: "Curious", tag: "Real stories · Learn something", icon: Compass, color: "#f59e0b", genres: ["99|36", "99"] },
];

export const addTaste = (type, genreIds, weight) => {
  const all = read("cs:taste", {});
  const t = { ...(all[type] || {}) };
  (genreIds || []).forEach((g) => (t[g] = (t[g] || 0) + weight));
  write("cs:taste", { ...all, [type]: t });
};

// Top genres for a type from quiz answers + watch history + My List
export const topGenres = (type, n = 2) => {
  const s = { ...(read("cs:taste", {})[type] || {}) };
  read("cs:history", []).filter((h) => h.type === type).forEach((h, i) =>
    (h.genreIds || []).forEach((g) => (s[g] = (s[g] || 0) + Math.max(0.5, 3 - i * 0.25))));
  read("cs:mylist", []).filter((h) => h.type === type).forEach((h) =>
    (h.genreIds || []).forEach((g) => (s[g] = (s[g] || 0) + 2)));
  return Object.entries(s).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, n).map(([g]) => g);
};
