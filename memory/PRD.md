# CineStream — PRD

## Original problem statement
Upgrade the user's movie21 (frontend) + m19 (backend) streaming site: remove Adsterra ad blocks, add movie/TV servers (0vidads.top, zxcstream.cc, vidy.st, vidcore.io, viduki.net, cinezo.live) and anime server megaplay.buzz, Netflix-style UI, suggestions, categories, drag & drop servers, live online counter (base 10-20), responsive, share buttons, speed + SEO.
Iteration 2: admin-managed ad slots (image/HTML code/video, incl. between Romance & Top Rated TV, video pre-roll), smart "For You" suggestions + taste quiz (The Decider), mood/vibe picker + Discover filters, "Right Now" live watching section, Top 10 rows, SEO keywords/content, remove Admin link from footer.

## Choices
- Admin: yash.brandstudio@gmail.com (ADMIN_EMAIL), Emergent-managed Clerk email+password; public site has no login.

## Architecture
- Backend FastAPI (server.py): TMDB proxy `/api/tmdb/*` (cached), AniList `/api/anime/*`, servers (public + admin CRUD/reorder), ads (public + admin CRUD), presence/live/views/top10, users/roles, `/api/sitemap.xml`. Mongo: servers, ads, views, users, meta.
- Frontend React + Tailwind + shadcn + dnd-kit + react-helmet-async. localStorage: My List, history, taste, per-device server order.

## Implemented
- 2026-11 Iteration 1: Netflix-style redesign, Adsterra removed, 20 movie/TV + 5 anime servers, drag reorder + drag-to-player, admin server manager, categories, suggestions, My List, live counter, share dialog, search, SEO meta.
- 2026-11 Iteration 2: Ads manager (8 placements, image/HTML/video, video pre-roll with skip), Right Now live section + watching-now badge, Top 10 movies/TV/anime by site views, For You rows, The Decider, vibe picker + Discover page filters, SEO content/FAQ/JSON-LD/keywords + dynamic sitemap, footer admin link removed, fixes (CSS var, ongoing anime episodes, anime 404, admin error handling), basic anti-spam on views/presence.

## Backlog
- P1: Continue watching with progress; viewer accounts to sync My List; fix remaining old broken button (user mentioned).
- P2: Server health check / auto-skip dead servers; admin visitor stats; push notifications; server-side prerender for share previews.
