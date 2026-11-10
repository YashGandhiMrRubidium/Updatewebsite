import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX, ExternalLink } from "lucide-react";
import { useApi } from "@/hooks/useApi";

const pick = (list) => (list.length ? list[Math.floor(Math.random() * list.length)] : null);

export const useAd = (placement, kinds) => {
  const { data } = useApi("/ads");
  return useMemo(
    () => pick((data || []).filter((a) => a.placement === placement && (!kinds || kinds.includes(a.kind)))),
    [data, placement] // eslint-disable-line react-hooks/exhaustive-deps
  );
};

const Label = () => <p className="mb-1 text-center text-[10px] uppercase tracking-[0.2em] text-gray-600">Advertisement</p>;

const AdBody = ({ ad }) => {
  if (ad.kind === "html")
    return (
      <iframe title={ad.name} srcDoc={`<!doctype html><html><head><base target="_blank"></head><body style="margin:0;display:flex;justify-content:center;align-items:center;background:transparent">${ad.html}</body></html>`}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
        style={{ height: ad.height }} className="w-full border-0" loading="lazy" data-testid={`ad-html-${ad.id}`} />
    );
  const media = ad.kind === "video"
    ? <video src={ad.video_url} autoPlay muted loop playsInline className="mx-auto max-h-[400px] w-full rounded-lg object-cover" />
    : <img src={ad.image_url} alt={ad.name} loading="lazy" className="mx-auto max-h-[400px] w-full rounded-lg object-cover" />;
  return ad.link_url ? <a href={ad.link_url} target="_blank" rel="sponsored noopener noreferrer" data-testid={`ad-link-${ad.id}`}>{media}</a> : media;
};

export const AdSlot = ({ placement, className = "" }) => {
  const ad = useAd(placement);
  if (!ad) return null;
  return (
    <div className={className} data-testid={`ad-slot-${placement}`}>
      <div className="mx-auto max-w-5xl">
        <Label />
        <AdBody ad={ad} />
      </div>
    </div>
  );
};

export const VideoAd = ({ ad, onDone }) => {
  const [left, setLeft] = useState(ad.skip_after);
  const [muted, setMuted] = useState(true);
  const ref = useRef(null);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return (
    <div className="absolute inset-0 bg-black" data-testid="video-preroll-ad">
      <video ref={ref} src={ad.video_url} autoPlay muted={muted} playsInline onEnded={onDone} onError={onDone} className="h-full w-full object-contain" />
      <span className="absolute left-3 top-3 rounded bg-yellow-400 px-2 py-0.5 text-[10px] font-black uppercase text-black">Ad</span>
      <div className="absolute bottom-3 left-3 flex gap-2">
        <button onClick={() => setMuted((m) => !m)} className="rounded-full bg-black/70 p-2" aria-label="Toggle sound" data-testid="ad-mute-toggle">
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        {ad.link_url && (
          <a href={ad.link_url} target="_blank" rel="sponsored noopener noreferrer" className="flex items-center gap-1 rounded-full bg-black/70 px-3 py-2 text-xs" data-testid="ad-learn-more">
            Learn more <ExternalLink size={12} />
          </a>
        )}
      </div>
      <button disabled={left > 0} onClick={onDone} data-testid="ad-skip-button"
        className="absolute bottom-3 right-3 rounded-md border border-white/30 bg-black/80 px-4 py-2 text-sm font-semibold disabled:opacity-70">
        {left > 0 ? `Skip in ${left}s` : "Skip ad ›"}
      </button>
    </div>
  );
};
