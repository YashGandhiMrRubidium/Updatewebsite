import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const TAGS = [
  ["Watch movies online free", "/movies"], ["Free TV shows online", "/tv"], ["Watch anime online free", "/anime"],
  ["Anime sub & dub", "/anime"], ["Hindi movies", "/discover?lang=hi"], ["Korean dramas", "/discover?type=tv&lang=ko"],
  ["Japanese movies", "/discover?lang=ja"], ["Action movies", "/movies?genre=28"], ["Horror movies", "/movies?genre=27"],
  ["Romantic movies", "/discover?vibe=romantic"], ["Comedy movies", "/movies?genre=35"], ["Sci-Fi movies", "/movies?genre=878"],
  ["Top rated movies", "/movies?sort=vote_average.desc"], ["New releases", "/movies?sort=primary_release_date.desc"],
  ["Trending web series", "/tv"], ["Classic 90s movies", "/discover?era=90s"],
];

export const FAQ = [
  ["Is CineStream free?", "Yes. CineStream is a 100% free movie, TV show and anime streaming website. No subscription, no credit card and no sign-up are needed."],
  ["Do I need to create an account to watch?", "No. Just open any title and press Play. Your My List and recommendations are saved on your device automatically."],
  ["Can I watch anime with English sub and dub?", "Yes. Most anime titles offer both SUB and DUB versions — switch anytime on the watch page."],
  ["What if a video does not play?", "Every title has many fast servers. Tap another server, or drag it onto the player to switch instantly."],
  ["Does CineStream work on mobile?", "Yes. CineStream works on Android, iPhone, tablets, laptops and smart TV browsers."],
];

export const SeoContent = () => (
  <section className="mx-4 rounded-2xl border border-white/5 bg-[var(--surface)]/60 p-6 sm:mx-8 sm:p-10 lg:mx-14" data-testid="seo-content">
    <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Watch Free Movies, TV Shows &amp; Anime Online in HD</h2>
    <div className="mt-4 grid gap-6 text-sm leading-relaxed text-gray-400 lg:grid-cols-2">
      <p>
        CineStream is one of the fastest-growing <strong className="text-gray-200">free movie streaming sites</strong>. Watch the latest Hollywood,
        Bollywood and Hindi dubbed movies, trending web series, Korean dramas and <strong className="text-gray-200">anime in sub and dub</strong> —
        in full HD, with no sign-up and no subscription. New movies and episodes are added every day.
      </p>
      <p>
        Looking for a <strong className="text-gray-200">123movies, Fmovies, Soap2day or Gogoanime alternative</strong>? CineStream gives you multiple
        fast servers for every title, smart recommendations based on your taste, a mood picker, Top 10 charts and live “watching now” counts —
        all in a clean, ad-light, Netflix-style experience on any device.
      </p>
    </div>
    <div className="mt-6 flex flex-wrap gap-2">
      {TAGS.map(([t, to]) => (
        <Link key={t} to={to} className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400 transition-colors hover:border-[var(--brand)] hover:text-white">{t}</Link>
      ))}
    </div>
    <div className="mt-8 divide-y divide-white/5">
      {FAQ.map(([q, a], i) => (
        <details key={q} className="group py-3" data-testid={`faq-${i}`}>
          <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-200">
            {q} <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-2 text-sm text-gray-400">{a}</p>
        </details>
      ))}
    </div>
  </section>
);

export const homeJsonLd = () => {
  const origin = window.location.origin;
  return [
    {
      "@context": "https://schema.org", "@type": "WebSite", name: "CineStream", url: origin,
      potentialAction: { "@type": "SearchAction", target: `${origin}/search?q={search_term_string}`, "query-input": "required name=search_term_string" },
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];
};
