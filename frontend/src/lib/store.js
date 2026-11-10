import { useCallback, useEffect, useState } from "react";

const read = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
};
const write = (k, v) => {
  localStorage.setItem(k, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent(`store:${k}`));
};

export const keyOf = (it) => `${it.type}:${it.id}`;
const slim = ({ id, type, title, poster, backdrop, year, rating }) => ({ id, type, title, poster, backdrop, year, rating });

export function useStored(k, d) {
  const [v, setV] = useState(() => read(k, d));
  useEffect(() => {
    const h = () => setV(read(k, d));
    window.addEventListener(`store:${k}`, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(`store:${k}`, h);
      window.removeEventListener("storage", h);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);
  const set = useCallback((next) => write(k, typeof next === "function" ? next(read(k, d)) : next), [k]); // eslint-disable-line react-hooks/exhaustive-deps
  return [v, set];
}

export function useMyList() {
  const [list, setList] = useStored("cs:mylist", []);
  const has = (it) => list.some((x) => keyOf(x) === keyOf(it));
  const toggle = (it) => {
    const exists = has(it);
    setList((l) => (exists ? l.filter((x) => keyOf(x) !== keyOf(it)) : [slim(it), ...l]));
    return !exists;
  };
  return { list, has, toggle };
}

export const pushHistory = (it) => {
  const h = read("cs:history", []).filter((x) => keyOf(x) !== keyOf(it));
  write("cs:history", [slim(it), ...h].slice(0, 12));
};

export const getSessionId = () => {
  let s = localStorage.getItem("cs:sid");
  if (!s) {
    s = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("cs:sid", s);
  }
  return s;
};
