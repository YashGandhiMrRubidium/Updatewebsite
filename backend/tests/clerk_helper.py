# Clerk helper for tests: find/create test users, mint session JWTs and sign-in tickets (secret never printed)
import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
SK = os.environ["CLERK_SECRET_KEY"]
API = "https://api.clerk.com/v1"
H = {"Authorization": f"Bearer {SK}", "User-Agent": "emergent-test", "Content-Type": "application/json"}

ADMIN_EMAIL = "yash.brandstudio@gmail.com"
MEMBER_EMAIL = "member+clerk_test@example.com"
PASSWORD = "CineTest!2026#Secure"


def find_user(email):
    r = requests.get(f"{API}/users", params={"email_address": email}, headers=H, timeout=15)
    r.raise_for_status()
    js = r.json()
    return js[0] if js else None


def ensure_user(email):
    u = find_user(email)
    if u:
        return u
    r = requests.post(f"{API}/users", json={"email_address": [email], "password": PASSWORD,
                                            "skip_password_checks": True}, headers=H, timeout=15)
    if r.status_code >= 300:
        print("create failed", r.status_code, r.text[:300], file=sys.stderr)
        r.raise_for_status()
    return r.json()


def session_token(user_id):
    r = requests.post(f"{API}/sessions", json={"user_id": user_id}, headers=H, timeout=15)
    if r.status_code >= 300:
        print("session failed", r.status_code, r.text[:300], file=sys.stderr)
        r.raise_for_status()
    sid = r.json()["id"]
    t = requests.post(f"{API}/sessions/{sid}/tokens", json={"expires_in_seconds": 3600}, headers=H, timeout=15)
    t.raise_for_status()
    return t.json()["jwt"]


def sign_in_ticket(user_id):
    r = requests.post(f"{API}/sign_in_tokens", json={"user_id": user_id, "expires_in_seconds": 3600},
                      headers=H, timeout=15)
    r.raise_for_status()
    return r.json()["token"]


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "info"
    a = ensure_user(ADMIN_EMAIL)
    m = ensure_user(MEMBER_EMAIL)
    if mode == "info":
        for u in (a, m):
            print(u["id"], [(e["email_address"], (e.get("verification") or {}).get("status")) for e in u["email_addresses"]])
    elif mode == "tokens":
        print("ADMIN_JWT=" + session_token(a["id"]))
        print("MEMBER_JWT=" + session_token(m["id"]))
    elif mode == "tickets":
        print("ADMIN_TICKET=" + sign_in_ticket(a["id"]))
        print("MEMBER_TICKET=" + sign_in_ticket(m["id"]))
