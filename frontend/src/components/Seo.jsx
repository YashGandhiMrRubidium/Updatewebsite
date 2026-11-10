import { Helmet } from "react-helmet-async";

const SITE = "CineStream";

export const KEYWORDS = "watch movies online free, free movie streaming site, watch free movies HD, free TV shows online, watch anime online free, anime sub dub free, new movies 2026 free, hindi dubbed movies online, bollywood movies free, hollywood movies in hindi, web series free, korean drama free, stream movies no sign up, 123movies alternative, fmovies alternative, soap2day alternative, gogoanime alternative, 9anime alternative, best free streaming site, netflix alternative free, trending movies today";

export const Seo = ({ title, description, image, type = "website", keywords, jsonLd }) => {
  const full = title ? `${title} | ${SITE}` : `${SITE} — Watch Movies, TV Shows & Anime Online`;
  const desc = (description || "Stream trending movies, TV shows and anime in HD. Multiple fast servers, no sign-up needed.").slice(0, 160);
  const url = typeof window !== "undefined" ? window.location.href : "";
  return (
    <Helmet>
      <title>{full}</title>
      <meta name="description" content={desc} />
      <meta name="keywords" content={keywords ? `${keywords}, ${KEYWORDS}` : KEYWORDS} />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <link rel="canonical" href={url} />
      <meta property="og:site_name" content={SITE} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={full} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
};
