import { useMemo, useState } from "react";
import { DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Play, RotateCcw, RefreshCw, SkipForward, Server } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { useStored } from "@/lib/store";
import { applyOrder, buildUrl } from "@/lib/servers";
import { VideoAd, useAd } from "@/components/AdSlot";

const AD_GAP = 10 * 60 * 1000;

const Chip = ({ server, index, active, overlay, ...rest }) => (
  <div {...rest} className={`flex w-full select-none items-center gap-2 rounded-md border px-2.5 py-2 text-left text-sm transition-[background-color,border-color,box-shadow] ${active ? "border-[var(--brand)] bg-[var(--brand)]/15 text-white shadow-[0_0_20px_-6px_var(--brand-glow)]" : "border-white/10 bg-[var(--surface)] text-gray-300 hover:border-white/25 hover:bg-[var(--surface-2)]"} ${overlay ? "scale-105 cursor-grabbing shadow-2xl" : "cursor-grab"}`}>
    <GripVertical size={14} className="shrink-0 text-gray-500" />
    <span className="font-mono text-[10px] text-gray-500">{String(index + 1).padStart(2, "0")}</span>
    <span className="flex-1 truncate font-medium">{server.name}</span>
    {active && <Play size={12} className="shrink-0 fill-[var(--brand)] text-[var(--brand)]" />}
  </div>
);

const SortableChip = ({ server, index, active, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: server.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }}>
      <Chip server={server} index={index} active={active} {...attributes} {...listeners} onClick={() => onSelect(server)} data-testid={`server-item-${server.id}`} />
    </div>
  );
};

const PlayerDrop = ({ src, dragging, title }) => {
  const { setNodeRef, isOver } = useDroppable({ id: "player-drop" });
  const ad = useAd("watch_preroll", ["video"]);
  const [adDone, setAdDone] = useState(() => Date.now() - Number(sessionStorage.getItem("cs:ad-ts") || 0) < AD_GAP);
  const finishAd = () => {
    sessionStorage.setItem("cs:ad-ts", String(Date.now()));
    setAdDone(true);
  };
  if (ad && !adDone)
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black ring-1 ring-white/10" data-testid="player-drop-zone">
        <VideoAd ad={ad} onDone={finishAd} />
      </div>
    );
  return (
    <div ref={setNodeRef} className="relative aspect-video w-full overflow-hidden rounded-lg bg-black ring-1 ring-white/10" data-testid="player-drop-zone">
      {src ? (
        <iframe key={src} src={src} title={title} className="h-full w-full" frameBorder="0" allowFullScreen referrerPolicy="origin"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture" data-testid="video-player" />
      ) : (
        <div className="flex h-full items-center justify-center text-gray-500">No server available</div>
      )}
      {dragging && (
        <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 border-2 border-dashed backdrop-blur-sm transition-colors ${isOver ? "border-[var(--brand)] bg-[var(--brand)]/25" : "border-white/30 bg-black/70"}`} data-testid="player-drop-overlay">
          <Play size={40} className="fill-white" />
          <p className="font-display text-lg font-bold">Drop to play on {dragging.name}</p>
        </div>
      )}
    </div>
  );
};

export const WatchPlayer = ({ media, title }) => {
  const kind = media.type === "anime" ? "anime" : "movie";
  const { data, loading } = useApi(`/servers?kind=${kind}`);
  const [order, setOrder] = useStored(`cs:srv:${kind}`, []);
  const [activeId, setActiveId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [nonce, setNonce] = useState(0);

  const servers = useMemo(() => applyOrder((data || []).filter((s) => buildUrl(s, media)), order), [data, order, media]);
  const active = servers.find((s) => s.id === activeId) || servers[0];
  const src = active ? buildUrl(active, media) : "";

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const select = (s) => {
    setActiveId(s.id);
    toast.success(`Playing on ${s.name}`);
  };
  const next = () => {
    if (!servers.length) return;
    const idx = servers.findIndex((s) => s.id === active?.id);
    select(servers[(idx + 1) % servers.length]);
  };
  const onDragEnd = ({ active: a, over }) => {
    setDragging(null);
    if (!over) return;
    const srv = servers.find((s) => s.id === a.id);
    if (over.id === "player-drop") return select(srv);
    if (a.id !== over.id) {
      const ids = servers.map((s) => s.id);
      setOrder(arrayMove(ids, ids.indexOf(a.id), ids.indexOf(over.id)));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={({ active: a }) => setDragging(servers.find((s) => s.id === a.id))}
      onDragCancel={() => setDragging(null)} onDragEnd={onDragEnd}>
      <PlayerDrop key={nonce} src={src} dragging={dragging} title={title} />
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-400">
        <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5" data-testid="active-server-name">
          <Server size={13} className="text-[var(--brand)]" /> {active ? active.name : "—"}
        </span>
        <button onClick={() => setNonce((n) => n + 1)} className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 hover:bg-white/10" data-testid="player-reload-button">
          <RefreshCw size={13} /> Reload
        </button>
        <button onClick={next} className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 hover:bg-white/10" data-testid="player-next-server-button">
          <SkipForward size={13} /> Next server
        </button>
        <span className="ml-auto hidden sm:inline">Not playing? Try another server.</span>
      </div>
      <div className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Servers</h2>
            <p className="text-xs text-gray-500">Tap to play · drag to reorder · drag onto the player to switch</p>
          </div>
          {order.length > 0 && (
            <button onClick={() => setOrder([])} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white" data-testid="reset-server-order">
              <RotateCcw size={12} /> Reset order
            </button>
          )}
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-md" />)}
          </div>
        ) : (
          <SortableContext items={servers.map((s) => s.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" data-testid="server-list">
              {servers.map((s, i) => <SortableChip key={s.id} server={s} index={i} active={s.id === active?.id} onSelect={select} />)}
            </div>
          </SortableContext>
        )}
      </div>
      <DragOverlay>{dragging && <Chip server={dragging} index={servers.findIndex((s) => s.id === dragging.id)} overlay />}</DragOverlay>
    </DndContext>
  );
};
