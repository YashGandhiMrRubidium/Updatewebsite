import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getSessionId } from "@/lib/store";

export const LiveCounter = ({ className = "" }) => {
  const [count, setCount] = useState(null);
  useEffect(() => {
    const sid = getSessionId();
    const beat = () => api.post("/presence", { session_id: sid }).then((r) => setCount(r.data.online)).catch(() => {});
    beat();
    const t = setInterval(beat, 10000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className={`flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs backdrop-blur-md ${className}`} data-testid="live-counter">
      <span className="live-dot h-2 w-2 rounded-full bg-[#46d369]" />
      <span className="font-semibold tabular-nums" data-testid="live-counter-value">{count ?? "—"}</span>
      <span className="text-gray-400">online</span>
    </div>
  );
};
