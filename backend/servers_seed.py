MOVIE_SERVERS = [
    ("0vidads", "0VidAds", "https://0vidads.top/embed/movie/{id}?back=1", "https://0vidads.top/embed/tv/{id}/{season}/{episode}?back=1"),
    ("zxcstream", "ZXC Stream", "https://zxcstream.cc/player/movie/{id}?autoplay=true", "https://zxcstream.cc/player/tv/{id}/{season}/{episode}?autoplay=true"),
    ("vidyst", "Vidy", "https://vidy.st/movie/{id}", "https://vidy.st/tv/{id}/{season}/{episode}"),
    ("vidcore", "VidCore", "https://vidcore.io/embed/movie/{id}", "https://vidcore.io/embed/tv/{id}/{season}/{episode}"),
    ("viduki", "Viduki", "https://www.viduki.net/movie/{id}", "https://www.viduki.net/tv/{id}/{season}/{episode}"),
    ("cinezo", "Cinezo", "https://cinezo.live/embed/movie/{id}", "https://cinezo.live/embed/tv/{id}/{season}/{episode}"),
    ("vidfast", "VidFast", "https://vidfast.pro/movie/{id}?autoPlay=true", "https://vidfast.pro/tv/{id}/{season}/{episode}?autoPlay=true"),
    ("mapple", "Mapple", "https://mapple.uk/watch/movie/{id}", "https://mapple.uk/watch/tv/{id}-{season}-{episode}"),
    ("fmovies4u", "FMovies4U", "https://fmovies4u.com/embed/tmdb-movie-{id}", "https://fmovies4u.com/embed/tmdb-tv-{id}/{season}/{episode}"),
    ("videasy", "Videasy", "https://player.videasy.net/movie/{id}?autoplay=1", "https://player.videasy.net/tv/{id}/{season}/{episode}?autoplay=1&autoplayNextEpisode=true"),
    ("vidsrcicu", "VidSrc ICU", "https://vidsrc.icu/embed/movie/{id}", "https://vidsrc.icu/embed/tv/{id}/{season}/{episode}"),
    ("2embed", "2Embed", "https://www.2embed.cc/embed/{id}", "https://www.2embed.cc/embedtv/{id}&s={season}&e={episode}"),
    ("vidsrcvip", "VidSrc VIP", "https://vidsrc.vip/embed/movie/{id}", "https://vidsrc.vip/embed/tv/{id}/{season}/{episode}"),
    ("vidsrcdev", "VidSrc Dev", "https://vidsrc.dev/embed/movie/{id}", "https://vidsrc.dev/embed/tv/{id}/{season}/{episode}"),
    ("embedder", "Embedder", "https://embedder.net/e/movie?tmdb={id}", "https://embedder.net/e/series?TMDB={id}&sea={season}&epi={episode}"),
    ("embedsu", "Embed SU", "https://embed.su/embed/movie/{id}", "https://embed.su/embed/tv/{id}/{season}/{episode}"),
    ("moviekex", "MovieKex", "https://moviekex.online/embed/movie/{id}", "https://moviekex.online/embed/tv/{id}/{season}/{episode}"),
    ("vidsrccc", "VidSrc CC", "https://vidsrc.cc/v2/embed/movie/{id}", "https://vidsrc.cc/v2/embed/tv/{id}/{season}/{episode}"),
    ("multiembed", "MultiEmbed", "https://multiembed.mov/?video_id={id}&tmdb=1", "https://multiembed.mov/?video_id={id}&tmdb=1&s={season}&e={episode}"),
    ("autoembed", "AutoEmbed", "https://player.autoembed.cc/embed/movie/{id}", "https://player.autoembed.cc/embed/tv/{id}/{season}/{episode}"),
]

# {id}=AniList id, {lang}=sub|dub, {dub}=true|false
ANIME_SERVERS = [
    ("megaplay", "MegaPlay", "https://megaplay.buzz/stream/ani/{id}/{episode}/{lang}"),
    ("vidnest", "VidNest", "https://vidnest.fun/anime/{id}/{episode}/{lang}"),
    ("vidnestpahe", "VidNest Pahe", "https://vidnest.fun/animepahe/{id}/{episode}/{lang}"),
    ("vidyanime", "Vidy Anime", "https://vidy.st/anime/{id}/{episode}"),
    ("cinezoanime", "Cinezo Anime", "https://cinezo.live/embed/anime/{id}/{episode}?dub={dub}"),
]


def seed_docs():
    docs = []
    for i, (sid, name, movie_url, tv_url) in enumerate(MOVIE_SERVERS):
        docs.append({"id": sid, "name": name, "kind": "movie", "movie_url": movie_url, "tv_url": tv_url,
                     "anime_url": "", "enabled": True, "order": i})
    for i, (sid, name, anime_url) in enumerate(ANIME_SERVERS):
        docs.append({"id": sid, "name": name, "kind": "anime", "movie_url": "", "tv_url": "",
                     "anime_url": anime_url, "enabled": True, "order": i})
    return docs
