# CineStream backend regression tests: public APIs (tmdb proxy, anime, presence, servers) + Clerk-protected admin/users APIs
import os
import pytest
import requests
from clerk_helper import ensure_user, session_token, ADMIN_EMAIL, MEMBER_EMAIL


def _base():
    url = os.environ.get("REACT_APP_BACKEND_URL")
    if not url:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    url = line.split("=", 1)[1].strip()
    return url.rstrip("/")


BASE_URL = _base()


@pytest.fixture(scope="module")
def admin_h():
    return {"Authorization": f"Bearer {session_token(ensure_user(ADMIN_EMAIL)['id'])}"}


@pytest.fixture(scope="module")
def member_h():
    return {"Authorization": f"Bearer {session_token(ensure_user(MEMBER_EMAIL)['id'])}"}


# --- public content APIs ---
class TestPublic:
    def test_root(self):
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200 and "message" in r.json()

    def test_tmdb_trending(self):
        r = requests.get(f"{BASE_URL}/api/tmdb/trending/all/week")
        assert r.status_code == 200
        assert len(r.json()["results"]) > 0

    def test_tmdb_movie_detail(self):
        r = requests.get(f"{BASE_URL}/api/tmdb/movie/550")
        assert r.status_code == 200 and r.json()["id"] == 550

    def test_tmdb_disallowed_path(self):
        r = requests.get(f"{BASE_URL}/api/tmdb/account/123")
        assert r.status_code == 400

    def test_anime_list_and_genre(self):
        r = requests.get(f"{BASE_URL}/api/anime/list", params={"genre": "Action"})
        assert r.status_code == 200
        media = r.json()["media"]
        assert len(media) > 0 and all("Action" in m["genres"] for m in media)

    def test_anime_search(self):
        r = requests.get(f"{BASE_URL}/api/anime/list", params={"search": "naruto", "sort": "SEARCH_MATCH"})
        assert r.status_code == 200
        assert any("naruto" in (m["title"]["romaji"] or "").lower() for m in r.json()["media"])

    def test_anime_detail(self):
        r = requests.get(f"{BASE_URL}/api/anime/21")
        assert r.status_code == 200 and r.json()["id"] == 21

    def test_anime_detail_404(self):
        r = requests.get(f"{BASE_URL}/api/anime/999999999")
        assert r.status_code == 404

    def test_presence(self):
        r = requests.post(f"{BASE_URL}/api/presence", json={"session_id": "TEST_pytest01"})
        assert r.status_code == 200
        d = r.json()
        assert d["online"] >= 10 and d["real"] >= 1

    def test_presence_invalid(self):
        r = requests.post(f"{BASE_URL}/api/presence", json={"session_id": "a"})
        assert r.status_code == 422

    def test_public_servers_order(self):
        m = [s["id"] for s in requests.get(f"{BASE_URL}/api/servers", params={"kind": "movie"}).json()]
        a = [s["id"] for s in requests.get(f"{BASE_URL}/api/servers", params={"kind": "anime"}).json()]
        assert m[:6] == ["0vidads", "zxcstream", "vidyst", "vidcore", "viduki", "cinezo"]
        assert a[0] == "megaplay"


# --- auth / roles ---
class TestAuth:
    def test_admin_servers_no_token(self):
        assert requests.get(f"{BASE_URL}/api/admin/servers").status_code == 401

    def test_admin_servers_bad_token(self):
        r = requests.get(f"{BASE_URL}/api/admin/servers", headers={"Authorization": "Bearer junk"})
        assert r.status_code == 401

    def test_admin_servers_member_403(self, member_h):
        assert requests.get(f"{BASE_URL}/api/admin/servers", headers=member_h).status_code == 403

    def test_me_roles(self, admin_h, member_h):
        assert requests.get(f"{BASE_URL}/api/me", headers=admin_h).json()["role"] == "admin"
        assert requests.get(f"{BASE_URL}/api/me", headers=member_h).json()["role"] == "member"

    def test_users_admin_only(self, admin_h, member_h):
        assert requests.get(f"{BASE_URL}/api/users", headers=member_h).status_code == 403
        r = requests.get(f"{BASE_URL}/api/users", headers=admin_h)
        assert r.status_code == 200 and "admin" in r.json()["roles"]

    def test_demote_last_admin_409(self, admin_h):
        users = requests.get(f"{BASE_URL}/api/users", headers=admin_h).json()["users"]
        admins = [u for u in users if u["role"] == "admin"]
        if len(admins) != 1:
            pytest.skip("More than one admin; would really demote")
        r = requests.patch(f"{BASE_URL}/api/users/{admins[0]['user_id']}/role", json={"role": "member"}, headers=admin_h)
        assert r.status_code == 409

    def test_set_role_unknown_user_404(self, admin_h):
        r = requests.patch(f"{BASE_URL}/api/users/user_TEST_none/role", json={"role": "member"}, headers=admin_h)
        assert r.status_code == 404


# --- admin server CRUD + reorder ---
class TestAdminServers:
    def test_crud_toggle(self, admin_h):
        payload = {"name": "TEST_srv", "kind": "movie", "movie_url": "https://example.com/m/{id}",
                   "tv_url": "https://example.com/t/{id}/{season}/{episode}"}
        r = requests.post(f"{BASE_URL}/api/admin/servers", json=payload, headers=admin_h)
        assert r.status_code == 200
        sid = r.json()["id"]
        try:
            pub = [s["id"] for s in requests.get(f"{BASE_URL}/api/servers", params={"kind": "movie"}).json()]
            assert sid in pub and pub[-1] == sid
            r = requests.put(f"{BASE_URL}/api/admin/servers/{sid}", json={**payload, "enabled": False}, headers=admin_h)
            assert r.status_code == 200 and r.json()["enabled"] is False
            pub = [s["id"] for s in requests.get(f"{BASE_URL}/api/servers", params={"kind": "movie"}).json()]
            assert sid not in pub
            allsrv = [s["id"] for s in requests.get(f"{BASE_URL}/api/admin/servers", headers=admin_h).json()]
            assert sid in allsrv
        finally:
            d = requests.delete(f"{BASE_URL}/api/admin/servers/{sid}", headers=admin_h)
            assert d.status_code == 200
        assert requests.delete(f"{BASE_URL}/api/admin/servers/{sid}", headers=admin_h).status_code == 404

    def test_update_missing_404(self, admin_h):
        r = requests.put(f"{BASE_URL}/api/admin/servers/TEST_nope", json={"name": "x", "kind": "movie"}, headers=admin_h)
        assert r.status_code == 404

    def test_create_validation(self, admin_h):
        r = requests.post(f"{BASE_URL}/api/admin/servers", json={"name": "", "kind": "movie"}, headers=admin_h)
        assert r.status_code == 422

    def test_reorder_and_restore(self, admin_h):
        all_anime = [s for s in requests.get(f"{BASE_URL}/api/admin/servers", headers=admin_h).json() if s["kind"] == "anime"]
        orig = [s["id"] for s in all_anime]
        swapped = [orig[1], orig[0]] + orig[2:]
        try:
            r = requests.put(f"{BASE_URL}/api/admin/servers-order", json={"kind": "anime", "ids": swapped}, headers=admin_h)
            assert r.status_code == 200
            pub = [s["id"] for s in requests.get(f"{BASE_URL}/api/servers", params={"kind": "anime"}).json()]
            assert pub[:2] == swapped[:2]
        finally:
            requests.put(f"{BASE_URL}/api/admin/servers-order", json={"kind": "anime", "ids": orig}, headers=admin_h)
        pub = [s["id"] for s in requests.get(f"{BASE_URL}/api/servers", params={"kind": "anime"}).json()]
        assert pub[0] == "megaplay"
