# CineStream iteration 2: presence/live, views/top10, ads CRUD + auth rules, sitemap, anime 404
import time
import uuid
import pytest
import requests
from pymongo import MongoClient
from dotenv import dotenv_values
from clerk_helper import ensure_user, session_token, ADMIN_EMAIL, MEMBER_EMAIL
from test_cinestream_api import BASE_URL

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def admin_h():
    return {"Authorization": f"Bearer {session_token(ensure_user(ADMIN_EMAIL)['id'])}"}


@pytest.fixture(scope="module")
def member_h():
    return {"Authorization": f"Bearer {session_token(ensure_user(MEMBER_EMAIL)['id'])}"}


@pytest.fixture(scope="module")
def created_ads(admin_h):
    ids = []
    yield ids
    for i in ids:
        requests.delete(f"{API}/admin/ads/{i}", headers=admin_h)


# --- presence + live ---
class TestPresenceLive:
    def test_presence_watching_returns_watchers(self):
        sid = "TEST_" + uuid.uuid4().hex[:8]
        r = requests.post(f"{API}/presence", json={"session_id": sid, "watching": {"type": "movie", "id": 550, "title": "Fight Club"}})
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d["watchers"], int) and 2 <= d["watchers"] <= 50
        assert d["online"] >= 10

    def test_presence_no_watching(self):
        r = requests.post(f"{API}/presence", json={"session_id": "TEST_" + uuid.uuid4().hex[:8]})
        assert r.status_code == 200 and r.json()["watchers"] is None

    def test_presence_bad_type(self):
        r = requests.post(f"{API}/presence", json={"session_id": "TEST_abcd", "watching": {"type": "x", "id": 1, "title": "t"}})
        assert r.status_code == 422

    def test_live_sorted(self):
        sid = "TEST_" + uuid.uuid4().hex[:8]
        requests.post(f"{API}/presence", json={"session_id": sid, "watching": {"type": "movie", "id": 550, "title": "Fight Club"}})
        r = requests.get(f"{API}/live")
        assert r.status_code == 200
        items = r.json()
        assert 1 <= len(items) <= 12
        w = [i["watching"] for i in items]
        assert w == sorted(w, reverse=True)
        assert any(i["type"] == "movie" and i["id"] == 550 and i["real"] >= 1 for i in items)


# --- views + top10 ---
class TestViewsTop10:
    MID = 999990001

    @classmethod
    def teardown_class(cls):
        env = dotenv_values("/app/backend/.env")
        c = MongoClient(env["MONGO_URL"])
        c[env["DB_NAME"]].views.delete_many({"key": f"movie:{cls.MID}"})

    def test_views_and_top10(self):
        for _ in range(60):
            r = requests.post(f"{API}/views", json={"type": "movie", "id": self.MID, "title": "TEST_View", "poster": None})
            assert r.status_code == 200 and r.json()["ok"] is True
        r = requests.get(f"{API}/top10", params={"type": "movie"})
        assert r.status_code == 200
        d = r.json()
        assert len(d) == 10
        assert d[0]["id"] == self.MID and d[0]["views"] >= 60
        assert len({(x["type"], x["id"]) for x in d}) == 10

    @pytest.mark.parametrize("t", ["tv", "anime"])
    def test_top10_other(self, t):
        r = requests.get(f"{API}/top10", params={"type": t})
        assert r.status_code == 200
        d = r.json()
        assert len(d) == 10 and all(x["type"] == t for x in d)

    def test_top10_bad_type(self):
        assert requests.get(f"{API}/top10", params={"type": "x"}).status_code == 422

    def test_views_validation(self):
        assert requests.post(f"{API}/views", json={"type": "movie", "id": "abc", "title": "x"}).status_code == 422


# --- ads ---
class TestAds:
    def test_ads_auth_rules(self, member_h):
        assert requests.get(f"{API}/admin/ads").status_code == 401
        assert requests.get(f"{API}/admin/ads", headers={"Authorization": "Bearer bad"}).status_code == 401
        assert requests.get(f"{API}/admin/ads", headers=member_h).status_code == 403
        assert requests.post(f"{API}/admin/ads", headers=member_h, json={"name": "x", "placement": "footer", "kind": "image"}).status_code == 403

    def test_ads_crud(self, admin_h, created_ads):
        r = requests.post(f"{API}/admin/ads", headers=admin_h, json={"name": "TEST_ad", "placement": "home_middle", "kind": "image",
                                                                    "image_url": "https://example.com/a.jpg", "height": 120})
        assert r.status_code == 200
        ad = r.json()
        created_ads.append(ad["id"])
        assert ad["enabled"] is True and ad["placement"] == "home_middle" and ad["created_at"]
        pub = requests.get(f"{API}/ads").json()
        assert any(a["id"] == ad["id"] for a in pub)
        upd = requests.put(f"{API}/admin/ads/{ad['id']}", headers=admin_h, json={**{k: ad[k] for k in ("name", "placement", "kind", "image_url", "height")}, "enabled": False})
        assert upd.status_code == 200 and upd.json()["enabled"] is False
        assert not any(a["id"] == ad["id"] for a in requests.get(f"{API}/ads").json())
        assert any(a["id"] == ad["id"] for a in requests.get(f"{API}/admin/ads", headers=admin_h).json())
        assert requests.delete(f"{API}/admin/ads/{ad['id']}", headers=admin_h).status_code == 200
        assert requests.delete(f"{API}/admin/ads/{ad['id']}", headers=admin_h).status_code == 404
        created_ads.remove(ad["id"])

    @pytest.mark.parametrize("body", [
        {"name": "TEST_x", "placement": "nowhere", "kind": "image"},
        {"name": "TEST_x", "placement": "footer", "kind": "gif"},
        {"name": "", "placement": "footer", "kind": "image"},
        {"name": "TEST_x", "placement": "footer", "kind": "image", "height": 5},
        {"name": "TEST_x", "placement": "watch_preroll", "kind": "video", "skip_after": 99},
    ])
    def test_ads_validation(self, admin_h, body):
        assert requests.post(f"{API}/admin/ads", headers=admin_h, json=body).status_code == 422

    def test_update_missing(self, admin_h):
        r = requests.put(f"{API}/admin/ads/nope123", headers=admin_h, json={"name": "TEST_x", "placement": "footer", "kind": "image"})
        assert r.status_code == 404


# --- sitemap + anime 404 ---
class TestMisc:
    def test_sitemap(self):
        r = requests.get(f"{API}/sitemap.xml")
        assert r.status_code == 200 and "xml" in r.headers["content-type"]
        assert r.text.count("<url>") > 50 and BASE_URL.replace("https://", "") in r.text
        assert "/movie/" in r.text and "/anime/" in r.text

    def test_anime_bad_id(self):
        assert requests.get(f"{API}/anime/99999999").status_code == 404

    def test_one_piece_ongoing(self):
        d = requests.get(f"{API}/anime/21").json()
        assert d["nextAiringEpisode"] is None or d["nextAiringEpisode"]["episode"] > 1000 or d["status"] != "RELEASING"
