import asyncio
import os
import random
import re
import time
import uuid
import logging
from contextlib import suppress
from pathlib import Path
from typing import List, Literal, Optional

import httpx
import requests
from dotenv import load_dotenv
from datetime import datetime, timezone
from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field
from pymongo import ASCENDING, IndexModel, ReturnDocument, UpdateOne
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

try:
    from backend.clerk_auth import clerk_router, require_user
    from backend.servers_seed import seed_docs
except ModuleNotFoundError:
    from clerk_auth import clerk_router, require_user
    from servers_seed import seed_docs

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]
TMDB_API_KEY = os.environ['TMDB_API_KEY']
TMDB_BASE = "https://api.themoviedb.org/3"
ANILIST_URL = "https://graphql.anilist.co"
logger = logging.getLogger(__name__)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

INDEXES = {
    "servers": [IndexModel([("id", ASCENDING)], name="id", unique=True),
                IndexModel([("kind", ASCENDING), ("order", ASCENDING)], name="kind_order")],
    "users": [IndexModel([("user_id", ASCENDING)], name="user_id", unique=True)],
    "views": [IndexModel([("key", ASCENDING), ("day", ASCENDING)], name="key_day", unique=True),
              IndexModel([("type", ASCENDING), ("day", ASCENDING)], name="type_day")],
    "ads": [IndexModel([("id", ASCENDING)], name="id", unique=True)],
}

app = FastAPI()
api_router = APIRouter(prefix="/api")
http: httpx.AsyncClient = None
_cache: dict = {}
CACHE_TTL = 600


def cache_get(key):
    hit = _cache.get(key)
    if hit and time.time() - hit[1] < CACHE_TTL:
        return hit[0]
    return None


def cache_set(key, data):
    if len(_cache) > 3000:
        _cache.clear()
    _cache[key] = (data, time.time())


# ---------- TMDB proxy ----------
TMDB_ALLOWED = re.compile(r"^(trending|movie|tv|discover|search|genre)(/[A-Za-z0-9_\-/]+)?$")


@api_router.get("/tmdb/{path:path}")
async def tmdb_proxy(path: str, request: Request):
    if not TMDB_ALLOWED.match(path):
        raise HTTPException(status_code=400, detail="Path not allowed")
    return await tmdb_get(path, dict(request.query_params))


async def tmdb_get(path: str, params: dict, key: Optional[str] = None):
    key = key or f"tmdb:{path}?{sorted(params.items())}"
    cached = cache_get(key)
    if cached is not None:
        return cached
    r = await http.get(f"{TMDB_BASE}/{path}", params={**params, "api_key": TMDB_API_KEY})
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail="TMDB request failed")
    data = r.json()
    cache_set(key, data)
    return data


# ---------- AniList ----------
MEDIA_FIELDS = """id idMal title { romaji english } coverImage { extraLarge large } bannerImage
averageScore genres episodes nextAiringEpisode { episode } status format seasonYear description(asHtml:false)"""


async def anilist(query: str, variables: dict, key: str):
    cached = cache_get(key)
    if cached is not None:
        return cached
    r = await http.post(ANILIST_URL, json={"query": query, "variables": variables})
    if r.status_code == 404:
        raise HTTPException(status_code=404, detail="Not found")
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="AniList request failed")
    data = r.json().get("data") or {}
    cache_set(key, data)
    return data


@api_router.get("/anime/list")
async def anime_list(sort: str = "TRENDING_DESC", genre: Optional[str] = None, search: Optional[str] = None,
                     page: int = 1, per_page: int = 20):
    if sort not in {"TRENDING_DESC", "POPULARITY_DESC", "SCORE_DESC", "START_DATE_DESC", "SEARCH_MATCH"}:
        sort = "TRENDING_DESC"
    q = f"""query ($page:Int,$perPage:Int,$sort:[MediaSort],$genre:String,$search:String) {{
      Page(page:$page, perPage:$perPage) {{ pageInfo {{ hasNextPage }}
        media(type: ANIME, sort:$sort, genre:$genre, search:$search, isAdult:false) {{ {MEDIA_FIELDS} }} }} }}"""
    v = {"page": page, "perPage": min(per_page, 50), "sort": [sort], "genre": genre, "search": search}
    data = await anilist(q, v, f"ani:list:{sorted(v.items(), key=str)}")
    return data.get("Page", {})


@api_router.get("/anime/{anime_id}")
async def anime_detail(anime_id: int):
    q = f"""query ($id:Int) {{ Media(id:$id, type: ANIME) {{ {MEDIA_FIELDS} duration studios(isMain:true) {{ nodes {{ name }} }}
      recommendations(perPage: 18, sort: RATING_DESC) {{ nodes {{ mediaRecommendation {{ {MEDIA_FIELDS} }} }} }} }} }}"""
    data = await anilist(q, {"id": anime_id}, f"ani:detail:{anime_id}")
    if not data.get("Media"):
        raise HTTPException(status_code=404, detail="Anime not found")
    return data["Media"]


# ---------- Presence, live watching, views ----------
presence: dict = {}
IMG = "https://image.tmdb.org/t/p/"


class MediaIn(BaseModel):
    type: Literal["movie", "tv", "anime"]
    id: int
    title: str = Field(max_length=200)
    poster: Optional[str] = Field(default=None, max_length=400)
    backdrop: Optional[str] = Field(default=None, max_length=400)
    year: Optional[str] = Field(default=None, max_length=8)
    rating: Optional[str] = Field(default=None, max_length=8)


class PresenceIn(BaseModel):
    session_id: str = Field(min_length=4, max_length=64)
    watching: Optional[MediaIn] = None


def base_online() -> int:
    return random.Random(int(time.time() // 15)).randint(10, 20)


def base_watchers(key: str) -> int:
    return random.Random(f"{key}:{int(time.time() // 60)}").randint(1, 5)


def mkey(m: dict) -> str:
    return f"{m['type']}:{m['id']}"


def slim_tmdb(r: dict, fb: str) -> dict:
    t = r.get("media_type") if r.get("media_type") in ("movie", "tv") else fb
    date = r.get("release_date") or r.get("first_air_date") or ""
    return {"type": t, "id": r["id"], "title": r.get("title") or r.get("name") or "",
            "poster": f"{IMG}w342{r['poster_path']}" if r.get("poster_path") else None,
            "backdrop": f"{IMG}w780{r['backdrop_path']}" if r.get("backdrop_path") else None,
            "year": date[:4], "rating": f"{r['vote_average']:.1f}" if r.get("vote_average") else None}


def slim_ani(m: dict) -> dict:
    t = m.get("title") or {}
    return {"type": "anime", "id": m["id"], "title": t.get("english") or t.get("romaji") or "",
            "poster": (m.get("coverImage") or {}).get("large"), "backdrop": m.get("bannerImage") or (m.get("coverImage") or {}).get("extraLarge"),
            "year": str(m["seasonYear"]) if m.get("seasonYear") else "", "rating": f"{m['averageScore'] / 10:.1f}" if m.get("averageScore") else None}


def active_sessions():
    now = time.time()
    for sid in [s for s, v in presence.items() if now - v[0] > 60]:
        presence.pop(sid, None)
    return presence.values()


def real_watchers() -> dict:
    out: dict = {}
    for _, w in active_sessions():
        if w:
            k = mkey(w)
            out.setdefault(k, {**w, "real": 0})["real"] += 1
    return out


@api_router.post("/presence")
async def heartbeat(body: PresenceIn):
    w = body.watching.model_dump() if body.watching else None
    presence[body.session_id] = (time.time(), w)
    real = len(list(active_sessions()))
    res = {"online": base_online() + real, "real": real, "watchers": None}
    if w:
        k = mkey(w)
        res["watchers"] = real_watchers().get(k, {"real": 0})["real"] + base_watchers(k)
    return res


@api_router.get("/live")
async def live_now():
    items = {k: {**v, "watching": v["real"] + base_watchers(k)} for k, v in real_watchers().items()}
    try:
        trending = (await tmdb_get("trending/all/day", {})).get("results", [])
    except HTTPException:
        trending = []
    for r in trending:
        if len(items) >= 12:
            break
        if r.get("media_type") not in ("movie", "tv") or not r.get("backdrop_path"):
            continue
        m = slim_tmdb(r, "movie")
        k = mkey(m)
        if k not in items:
            items[k] = {**m, "real": 0, "watching": base_watchers(k)}
    return sorted(items.values(), key=lambda x: -x["watching"])[:12]


@api_router.post("/views")
async def record_view(body: MediaIn):
    m = body.model_dump()
    day = time.strftime("%Y-%m-%d", time.gmtime())
    await db.views.update_one({"key": mkey(m), "day": day}, {"$inc": {"count": 1}, "$set": {**m, "key": mkey(m), "day": day}}, upsert=True)
    return {"ok": True}


@api_router.get("/top10")
async def top10(type: Literal["movie", "tv", "anime"]):
    since = time.strftime("%Y-%m-%d", time.gmtime(time.time() - 7 * 86400))
    rows = await db.views.aggregate([
        {"$match": {"type": type, "day": {"$gte": since}}},
        {"$group": {"_id": "$key", "views": {"$sum": "$count"}, "item": {"$last": "$$ROOT"}}},
        {"$sort": {"views": -1}}, {"$limit": 10},
    ]).to_list(10)
    fields = ("type", "id", "title", "poster", "backdrop", "year", "rating")
    out = [{**{f: r["item"].get(f) for f in fields}, "views": r["views"]} for r in rows]
    if len(out) < 10:
        if type == "anime":
            fill = [slim_ani(m) for m in (await anime_list(sort="TRENDING_DESC", per_page=20)).get("media", [])]
        else:
            fill = [slim_tmdb(r, type) for r in (await tmdb_get(f"trending/{type}/week", {})).get("results", []) if r.get("poster_path")]
        seen = {mkey(x) for x in out}
        out += [{**x, "views": 0} for x in fill if mkey(x) not in seen][: 10 - len(out)]
    return out


# ---------- Servers ----------
class Server(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    kind: Literal["movie", "anime"]
    movie_url: str = ""
    tv_url: str = ""
    anime_url: str = ""
    enabled: bool = True
    order: int = 0


class ServerIn(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    kind: Literal["movie", "anime"]
    movie_url: str = ""
    tv_url: str = ""
    anime_url: str = ""
    enabled: bool = True


class ReorderIn(BaseModel):
    kind: Literal["movie", "anime"]
    ids: List[str]


@api_router.get("/servers", response_model=List[Server])
async def public_servers(kind: Literal["movie", "anime"]):
    return await db.servers.find({"kind": kind, "enabled": True}, {"_id": 0}).sort("order", 1).to_list(200)


# ---------- Roles ----------
ROLES = ["admin", "member"]
DEFAULT_ROLE = "member"
RETIRED_ROLES: dict = {}
RANK = {r: len(ROLES) - i for i, r in enumerate(ROLES)}
ENV = "live" if os.environ.get("CLERK_PUBLISHABLE_KEY", "").startswith("pk_live_") else "preview"
IN_ENV = {"env": {"$in": [ENV, None]}}


def effective_role(role) -> str:
    role = RETIRED_ROLES.get(role, role)
    return role if role in ROLES else DEFAULT_ROLE


def _clerk_user(user_id: str) -> dict:
    r = requests.get(f"https://api.clerk.com/v1/users/{user_id}", timeout=10,
                     headers={"Authorization": f"Bearer {os.environ['CLERK_SECRET_KEY']}", "User-Agent": "emergent-app"})
    r.raise_for_status()
    return r.json()


def _verified_emails(cu: dict) -> list:
    return [e["email_address"].lower() for e in cu.get("email_addresses", [])
            if (e.get("verification") or {}).get("status") == "verified"]


async def current_member(user: dict = Depends(require_user)) -> dict:
    uid = user["user_id"]
    member = await db.users.find_one({"user_id": uid}, {"_id": 0})
    if member is None or not member.get("role"):
        cu = await asyncio.to_thread(_clerk_user, uid)
        admins = {e.strip().lower() for e in os.environ.get("ADMIN_EMAIL", "").split(",") if e.strip()}
        emails = _verified_emails(cu)
        role = "admin" if any(e in admins for e in emails) else DEFAULT_ROLE
        await db.users.update_one({"user_id": uid, "role": {"$in": [None, ""]}}, {"$set": {"role": role}})
        member = await db.users.find_one_and_update(
            {"user_id": uid}, {"$setOnInsert": {"user_id": uid, "role": role, "email": emails[0] if emails else ""}},
            upsert=True, projection={"_id": 0}, return_document=ReturnDocument.AFTER)
    if member.get("env") != ENV:
        await db.users.update_one({"user_id": uid}, {"$set": {"env": ENV}})
    return {**member, "env": ENV, "role": effective_role(member["role"])}


def require_role(*roles: str):
    async def check(member: dict = Depends(current_member)) -> dict:
        if member["role"] not in roles:
            raise HTTPException(status_code=403, detail="Not allowed")
        return member
    return check


@api_router.get("/me")
async def me(member: dict = Depends(current_member)):
    return {"user_id": member["user_id"], "role": member["role"], "email": member.get("email", "")}


@api_router.get("/users")
async def list_users(admin: dict = Depends(require_role("admin"))):
    people = await db.users.find(IN_ENV, {"_id": 0}).to_list(1000)
    return {"roles": [r for r in ROLES if RANK[r] <= RANK[admin["role"]]],
            "users": [{**p, "role": effective_role(p.get("role"))} for p in people]}


class RoleIn(BaseModel):
    role: str


@api_router.patch("/users/{user_id}/role")
async def set_role(user_id: str, body: RoleIn, admin: dict = Depends(require_role("admin"))):
    if body.role not in ROLES or RANK[body.role] > RANK[admin["role"]]:
        raise HTTPException(status_code=403, detail="Not allowed")
    target = await db.users.find_one({"user_id": user_id, **IN_ENV}, {"_id": 0})
    if target is None:
        raise HTTPException(status_code=404, detail="Not found")
    if (effective_role(target.get("role")) == "admin" and body.role != "admin"
            and await db.users.count_documents({"role": "admin", **IN_ENV}) <= 1):
        raise HTTPException(status_code=409, detail="Keep at least one admin")
    await db.users.update_one({"user_id": user_id}, {"$set": {"role": body.role}})
    return {"user_id": user_id, "role": body.role}


# ---------- Admin server manager ----------
admin_only = require_role("admin")


@api_router.get("/admin/servers", response_model=List[Server])
async def admin_servers(_: dict = Depends(admin_only)):
    return await db.servers.find({}, {"_id": 0}).sort([("kind", 1), ("order", 1)]).to_list(500)


@api_router.post("/admin/servers", response_model=Server)
async def create_server(body: ServerIn, _: dict = Depends(admin_only)):
    last = await db.servers.find_one({"kind": body.kind}, {"_id": 0, "order": 1}, sort=[("order", -1)])
    doc = Server(id=uuid.uuid4().hex[:10], order=(last["order"] + 1) if last else 0, **body.model_dump())
    await db.servers.insert_one(doc.model_dump())
    return doc


@api_router.put("/admin/servers/{server_id}", response_model=Server)
async def update_server(server_id: str, body: ServerIn, _: dict = Depends(admin_only)):
    doc = await db.servers.find_one_and_update({"id": server_id}, {"$set": body.model_dump()},
                                               projection={"_id": 0}, return_document=ReturnDocument.AFTER)
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return doc


@api_router.delete("/admin/servers/{server_id}")
async def delete_server(server_id: str, _: dict = Depends(admin_only)):
    if (await db.servers.delete_one({"id": server_id})).deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@api_router.put("/admin/servers-order")
async def reorder_servers(body: ReorderIn, _: dict = Depends(admin_only)):
    if body.ids:
        await db.servers.bulk_write([UpdateOne({"id": sid, "kind": body.kind}, {"$set": {"order": i}}) for i, sid in enumerate(body.ids)])
    return {"ok": True}


# ---------- Ads ----------
PLACEMENTS = Literal["home_top", "home_middle", "home_bottom", "browse_top", "title_page",
                     "watch_below_player", "watch_preroll", "footer"]


class AdIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    placement: PLACEMENTS
    kind: Literal["image", "html", "video"]
    image_url: str = Field(default="", max_length=1000)
    link_url: str = Field(default="", max_length=1000)
    html: str = Field(default="", max_length=20000)
    video_url: str = Field(default="", max_length=1000)
    height: int = Field(default=90, ge=30, le=800)
    skip_after: int = Field(default=5, ge=0, le=60)
    enabled: bool = True


class Ad(AdIn):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str


@api_router.get("/ads", response_model=List[Ad])
async def public_ads():
    return await db.ads.find({"enabled": True}, {"_id": 0}).sort("created_at", 1).to_list(200)


@api_router.get("/admin/ads", response_model=List[Ad])
async def admin_ads(_: dict = Depends(admin_only)):
    return await db.ads.find({}, {"_id": 0}).sort("created_at", 1).to_list(500)


@api_router.post("/admin/ads", response_model=Ad)
async def create_ad(body: AdIn, _: dict = Depends(admin_only)):
    ad = Ad(id=uuid.uuid4().hex[:10], created_at=datetime.now(timezone.utc).isoformat(), **body.model_dump())
    await db.ads.insert_one(ad.model_dump())
    return ad


@api_router.put("/admin/ads/{ad_id}", response_model=Ad)
async def update_ad(ad_id: str, body: AdIn, _: dict = Depends(admin_only)):
    doc = await db.ads.find_one_and_update({"id": ad_id}, {"$set": body.model_dump()}, projection={"_id": 0}, return_document=ReturnDocument.AFTER)
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return doc


@api_router.delete("/admin/ads/{ad_id}")
async def delete_ad(ad_id: str, _: dict = Depends(admin_only)):
    if (await db.ads.delete_one({"id": ad_id})).deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ---------- Sitemap ----------
@api_router.get("/sitemap.xml")
async def sitemap(request: Request):
    host = (request.headers.get("x-forwarded-host") or request.headers.get("host", "")).split(",")[0].strip()
    base = f"https://{host}"
    urls = ["/", "/movies", "/tv", "/anime", "/discover", "/search"]
    for t in ("movie", "tv"):
        for path in (f"trending/{t}/week", f"{t}/popular", f"{t}/top_rated"):
            with suppress(HTTPException):
                urls += [f"/{t}/{r['id']}/{slugify(r.get('title') or r.get('name'))}" for r in (await tmdb_get(path, {})).get("results", [])]
    with suppress(HTTPException):
        urls += [f"/anime/{m['id']}/{slugify(slim_ani(m)['title'])}" for m in (await anime_list(sort="POPULARITY_DESC", per_page=50)).get("media", [])]
    body = "".join(f"<url><loc>{base}{u}</loc></url>" for u in dict.fromkeys(urls))
    return Response(content=f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>', media_type="application/xml")


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")[:60]


@api_router.get("/")
async def root():
    return {"message": "CineStream API"}


app.include_router(api_router)
app.include_router(clerk_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


async def ensure_indexes():
    for collection, models in INDEXES.items():
        for model in models:
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:
                logger.error("ensure_indexes(%s): %s", collection, exc)


async def seed_servers():
    if await db.meta.find_one({"_key": "servers_seeded_v1"}):
        return
    for doc in seed_docs():
        await db.servers.update_one({"id": doc["id"]}, {"$setOnInsert": doc}, upsert=True)
    await db.meta.insert_one({"_key": "servers_seeded_v1"})


@app.on_event("startup")
async def startup():
    global http
    http = httpx.AsyncClient(timeout=12.0, headers={"Accept": "application/json"})
    app.state.index_task = asyncio.create_task(ensure_indexes())
    await seed_servers()


@app.on_event("shutdown")
async def shutdown():
    app.state.index_task.cancel()
    with suppress(asyncio.CancelledError):
        await app.state.index_task
    await http.aclose()
    client.close()
