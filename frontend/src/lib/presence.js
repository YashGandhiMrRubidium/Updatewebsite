import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getSessionId } from "@/lib/store";

let watching = null;
let last = { online: null, watchers: null };
let started = false;
const subs = new Set();

const beat = () =>
  api
    .post("/presence", { session_id: getSessionId(), watching })
    .then((r) => {
      last = r.data;
      subs.forEach((f) => f(last));
    })
    .catch(() => {});

export const setWatching = (w) => {
  watching = w ? { type: w.type, id: Number(w.id), title: w.title, poster: w.poster, backdrop: w.backdrop, year: w.year, rating: w.rating } : null;
  if (!w) last = { ...last, watchers: null };
  beat();
};

export const usePresence = () => {
  const [s, setS] = useState(last);
  useEffect(() => {
    subs.add(setS);
    if (!started) {
      started = true;
      beat();
      setInterval(beat, 10000);
    }
    return () => subs.delete(setS);
  }, []);
  return s;
};

export const recordView = (it) => {
  const k = `cs:viewed:${it.type}:${it.id}`;
  if (sessionStorage.getItem(k)) return;
  sessionStorage.setItem(k, "1");
  const { type, id, title, poster, backdrop, year, rating } = it;
  api.post("/views", { type, id: Number(id), title, poster, backdrop, year, rating }).catch(() => {});
};
