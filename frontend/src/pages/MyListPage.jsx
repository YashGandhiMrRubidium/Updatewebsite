import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Grid } from "@/components/Grid";
import { Seo } from "@/components/Seo";
import { useMyList } from "@/lib/store";

const TABS = [["all", "All"], ["movie", "Movies"], ["tv", "TV Shows"], ["anime", "Anime"]];

export default function MyListPage() {
  const { list } = useMyList();
  const [tab, setTab] = useState("all");
  const items = list.filter((x) => tab === "all" || x.type === tab);
  return (
    <div className="px-4 pt-20 sm:px-8 sm:pt-24 lg:px-14" data-testid="my-list-page">
      <Seo title="My List" />
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em] text-[var(--brand)]">Saved on this device</p>
      <h1 className="font-display mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">My List</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} data-testid={`mylist-tab-${v}`}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${tab === v ? "bg-white text-black" : "bg-white/5 text-gray-400 hover:text-white"}`}>{l}</button>
        ))}
      </div>
      {items.length ? (
        <Grid items={items} testId="mylist-grid" />
      ) : (
        <div className="flex flex-col items-center gap-4 py-24 text-center" data-testid="mylist-empty">
          <Heart size={44} className="text-[var(--brand)]" />
          <p className="max-w-sm text-gray-400">Your list is empty. Tap the heart on any poster to save it here.</p>
          <Link to="/" className="btn-primary rounded-md px-5 py-2 font-semibold" data-testid="mylist-browse-button">Browse titles</Link>
        </div>
      )}
    </div>
  );
}
