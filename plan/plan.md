# Movie & Anime Streaming Site — Redesign and Upgrade

A fast, responsive movie, TV and anime streaming website with a cinematic dark-and-red look, more playback servers, smart suggestions and easy sharing.
It replaces the current design and removes the "Extra" section.

## Who it's for
- Viewers who want to browse and watch movies, TV shows and anime on phone, tablet or desktop.
- The site owner (admin), who manages the list of playback servers.

## Core features and experience
- **New streaming-style design**: dark background, red accents, large featured banner, horizontal rows of posters, smooth hover zoom, page and card animations. Inspired by big streaming apps but with its own style.
- **"Extra" section removed** from the site completely.
- **More servers**
  - Movies & TV: 0vidads.top, zxcstream.cc, vidy.st, vidcore.io, viduki.net, cinezo.live (added next to the existing ones).
  - Anime: megaplay.buzz added as an anime server.
- **Server controls on the watch page**
  - Viewers drag servers to reorder the list; their order is remembered on their device.
  - Viewers can drag a server onto the player to switch to it (a tap also works on phones).
  - Admin page to add, remove, enable/disable and set the default order of servers for everyone.
- **Categories**: browse by genre (Action, Comedy, Horror, Romance, Sci‑Fi, etc.) and by type (Movies, TV, Anime).
- **Suggestions**: "More like this" on every title page, plus "Trending", "Popular" and "Because you watched…" rows on home.
- **My List / Liked**: heart or add any title; saved on the viewer's device, no login needed.
- **Live "people online" counter**: shows real visitors plus a base number that moves between 10 and 20, updating every few seconds.
- **Share button**: on the site and on every movie/show page — share to WhatsApp, Telegram, X, Facebook, or copy link (uses the phone's native share menu when available).
- **Search** with instant results.
- **Fully responsive** for phone, tablet and desktop.
- **Speed**: lazy-loaded images, fast page switching, small loading skeletons.
- **SEO**: proper page titles and descriptions per movie/show, share previews (poster + title when a link is shared), sitemap and search-engine friendly links.

## User flow
1. Viewer opens the home page → sees a featured banner, online counter and rows (Trending, Popular, Anime, categories).
2. Hovers or taps a poster → quick preview card → opens the title page.
3. Title page shows details, "Play", "Add to My List", "Share" and "More like this".
4. Watch page plays on the default server; viewer can switch, reorder or drag a server onto the player.
5. Admin signs in → opens the server manager → adds/edits/reorders servers for everyone.

## UI/UX feel
Cinematic, dark, bold red highlights, large imagery, smooth motion on hover and scroll, clean readable text, and quick, light-weight pages.

## Implementation phases
- **Phase 1 (MVP, built now)**: new design across all pages, Extra section removed, all new movie/TV/anime servers, server reorder + drag-to-player + admin server manager, categories, suggestions, My List, live online counter, share buttons, responsive layout, speed and SEO improvements.
- **Phase 2**: "Continue watching" with progress, viewer accounts to sync My List across devices, check and fix any remaining broken buttons.
- **Phase 3**: server health check (auto-skip dead servers), visitor stats for the admin, push notifications for new releases.

## Assumptions
- The uploaded projects (movie21 frontend + m19 backend) are the starting point; the existing movie data source stays the same.
- New servers are added alongside current ones, not replacing them; links follow each server's standard movie/TV/episode format.
- The anime server uses episode-based links from megaplay.buzz.
- Admin page is protected by a sign-in; only the admin email given at build time gets access.
- "People online" base number is shown even when few real visitors are on.
- The earlier mentioned button error is left for later (Phase 2), as requested.
- Content is only embedded from the listed third-party servers; the site does not host video files.
