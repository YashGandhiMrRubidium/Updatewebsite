import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
export const api = axios.create({ baseURL: API });

const memo = new Map();

export const cachedGet = (url) => {
  if (memo.has(url)) return memo.get(url);
  const p = api.get(url).then((r) => r.data);
  memo.set(url, p);
  p.catch(() => memo.delete(url));
  return p;
};
