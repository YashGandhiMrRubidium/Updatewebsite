export const applyOrder = (servers, order) => {
  const idx = new Map(order.map((id, i) => [id, i]));
  const rank = (s) => (idx.has(s.id) ? idx.get(s.id) : 1000 + s.order);
  return [...servers].sort((a, b) => rank(a) - rank(b));
};

export const buildUrl = (srv, { type, id, season, episode, lang }) => {
  const t = type === "anime" ? srv.anime_url : type === "tv" ? srv.tv_url : srv.movie_url;
  if (!t) return "";
  return t
    .replaceAll("{id}", id)
    .replaceAll("{season}", season || 1)
    .replaceAll("{episode}", episode || 1)
    .replaceAll("{lang}", lang || "sub")
    .replaceAll("{dub}", lang === "dub" ? "true" : "false");
};
