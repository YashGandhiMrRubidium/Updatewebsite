import { useCallback, useEffect, useState } from "react";
import { Image, Code2, Film, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const PLACEMENTS = [
  ["home_top", "Home · below Trending"], ["home_middle", "Home · between Romance & Top Rated TV"], ["home_bottom", "Home · bottom"],
  ["browse_top", "Browse / Discover · top"], ["title_page", "Title page"], ["watch_below_player", "Watch page · below player"],
  ["watch_preroll", "Watch page · video ad before player"], ["footer", "All pages · above footer"],
];
const KINDS = [["image", "Image banner", Image], ["html", "Ad code (HTML/JS)", Code2], ["video", "Video", Film]];
const EMPTY = { name: "", placement: "home_middle", kind: "image", image_url: "", link_url: "", html: "", video_url: "", height: 90, skip_after: 5, enabled: true };
const inputCls = "w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";
const pick = ({ name, placement, kind, image_url, link_url, html, video_url, height, skip_after, enabled }) =>
  ({ name, placement, kind, image_url, link_url, html, video_url, height: Number(height), skip_after: Number(skip_after), enabled });

const L = ({ t, children }) => <label className="block space-y-1"><span className="text-xs font-semibold text-gray-300">{t}</span>{children}</label>;

const AdForm = ({ initial, onSave, onClose }) => {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-white/10 bg-[var(--surface)] text-white" data-testid="ad-form-dialog">
        <DialogHeader>
          <DialogTitle className="font-display">{initial.id ? "Edit ad" : "Add ad"}</DialogTitle>
          <DialogDescription className="text-gray-400">Choose where it shows and what it is. Paste ad network code (e.g. Adsterra, Monetag) as “Ad code”.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
          <L t="Name"><input className={inputCls} value={f.name} onChange={set("name")} required maxLength={60} data-testid="ad-form-name" /></L>
          <L t="Placement">
            <select className={inputCls} value={f.placement} onChange={(e) => setF({ ...f, placement: e.target.value, kind: e.target.value === "watch_preroll" ? "video" : f.kind })} data-testid="ad-form-placement">
              {PLACEMENTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </L>
          <div className="grid grid-cols-3 gap-2">
            {KINDS.map(([k, l, Icon]) => (
              <button type="button" key={k} disabled={f.placement === "watch_preroll" && k !== "video"} onClick={() => setF({ ...f, kind: k })} data-testid={`ad-form-kind-${k}`}
                className={`flex flex-col items-center gap-1 rounded-md py-2 text-xs font-semibold disabled:opacity-30 ${f.kind === k ? "bg-[var(--brand)]" : "bg-white/5 text-gray-400"}`}><Icon size={16} />{l}</button>
            ))}
          </div>
          {f.kind === "image" && <L t="Image URL"><input className={inputCls} value={f.image_url} onChange={set("image_url")} required placeholder="https://…/banner.jpg" data-testid="ad-form-image-url" /></L>}
          {f.kind === "video" && <L t="Video URL (.mp4)"><input className={inputCls} value={f.video_url} onChange={set("video_url")} required placeholder="https://…/ad.mp4" data-testid="ad-form-video-url" /></L>}
          {f.kind === "html" && (
            <>
              <L t="Ad code"><textarea className={`${inputCls} h-32 font-mono text-xs`} value={f.html} onChange={set("html")} required data-testid="ad-form-html" /></L>
              <L t="Height (px)"><input type="number" min={30} max={800} className={inputCls} value={f.height} onChange={set("height")} data-testid="ad-form-height" /></L>
            </>
          )}
          {f.kind !== "html" && <L t="Click-through link (optional)"><input className={inputCls} value={f.link_url} onChange={set("link_url")} placeholder="https://advertiser.com" data-testid="ad-form-link-url" /></L>}
          {f.placement === "watch_preroll" && <L t="Skip button after (seconds)"><input type="number" min={0} max={60} className={inputCls} value={f.skip_after} onChange={set("skip_after")} data-testid="ad-form-skip-after" /></L>}
          <button type="submit" className="btn-primary w-full rounded-md py-2.5 font-semibold" data-testid="ad-form-save">Save</button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const AdsManager = ({ call }) => {
  const [ads, setAds] = useState([]);
  const [editing, setEditing] = useState(null);
  const load = useCallback(() => call("get", "/admin/ads").then(setAds).catch(() => toast.error("Failed to load ads")), [call]);
  useEffect(() => { load(); }, [load]);
  const run = async (fn, ok) => {
    try { await fn(); if (ok) toast.success(ok); } catch (e) { toast.error(e?.response?.data?.detail?.[0]?.msg || "Something went wrong"); }
    load();
  };
  const save = (f) => run(async () => {
    f.id ? await call("put", `/admin/ads/${f.id}`, pick(f)) : await call("post", "/admin/ads", pick(f));
    setEditing(null);
  }, "Ad saved");

  return (
    <section data-testid="admin-ads-manager">
      <div className="mb-4 flex items-center gap-3">
        <p className="flex-1 text-xs text-gray-500">Turn ads on/off anytime. If a placement has several ads, one is shown at random.</p>
        <button onClick={() => setEditing(EMPTY)} className="btn-primary flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold" data-testid="admin-add-ad"><Plus size={16} /> Add ad</button>
      </div>
      {!ads.length && <p className="rounded-md border border-dashed border-white/10 p-8 text-center text-sm text-gray-500" data-testid="admin-ads-empty">No ads yet. Your site is ad-free until you add one.</p>}
      <div className="space-y-2">
        {ads.map((a) => {
          const Icon = (KINDS.find((k) => k[0] === a.kind) || KINDS[0])[2];
          return (
            <div key={a.id} className="flex items-center gap-3 rounded-md border border-white/5 bg-[var(--surface)] px-3 py-2.5" data-testid={`admin-ad-${a.id}`}>
              <Icon size={18} className="shrink-0 text-gray-400" />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${a.enabled ? "" : "text-gray-500 line-through"}`}>{a.name}</p>
                <p className="truncate text-[11px] text-gray-500">{PLACEMENTS.find((p) => p[0] === a.placement)?.[1]}</p>
              </div>
              <Switch checked={a.enabled} onCheckedChange={() => run(() => call("put", `/admin/ads/${a.id}`, pick({ ...a, enabled: !a.enabled })))} data-testid={`admin-ad-toggle-${a.id}`} />
              <button onClick={() => setEditing(a)} className="rounded p-1.5 text-gray-400 hover:bg-white/5 hover:text-white" aria-label="Edit" data-testid={`admin-ad-edit-${a.id}`}><Pencil size={15} /></button>
              <button onClick={() => window.confirm(`Delete ${a.name}?`) && run(() => call("delete", `/admin/ads/${a.id}`), "Ad deleted")}
                className="rounded p-1.5 text-gray-400 hover:bg-red-500/10 hover:text-red-400" aria-label="Delete" data-testid={`admin-ad-delete-${a.id}`}><Trash2 size={15} /></button>
            </div>
          );
        })}
      </div>
      {editing && <AdForm initial={editing} onSave={save} onClose={() => setEditing(null)} />}
    </section>
  );
};
