import { Helmet } from "react-helmet-async";

const SITE = "CineStream";

export const Seo = ({ title, description, image, type = "website" }) => {
  const full = title ? `${title} | ${SITE}` : `${SITE} — Watch Movies, TV Shows & Anime Online`;
  const desc = (description || "Stream trending movies, TV shows and anime in HD. Multiple fast servers, no sign-up needed.").slice(0, 160);
  const url = typeof window !== "undefined" ? window.location.href : "";
  return (
    <Helmet>
      <title>{full}</title>
      <meta name="description" content={desc} />
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
    </Helmet>
  );
};
