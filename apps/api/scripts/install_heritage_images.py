"""
HeritageAI: download Wikimedia Commons photos for the 12 newly added sites.

Run from apps/api:
    python scripts/install_heritage_images.py

This script:
- Waits between Wikimedia requests and retries temporary rate limits.
- Only updates the 12 listed site IDs when image_url IS NULL.
- Leaves the original eight site images untouched.
- Downloads Commons thumbnails into static/heritage/.
- Prints the selected Commons file title and license information for review.
"""
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
import json
import re
import sys
import time

from sqlalchemy import select

# Make the apps/api project root importable when this file is run directly.
API_DIR = Path(__file__).resolve().parents[1]
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

from app.core.database import SessionLocal
from app.heritage_models import HeritageSite

IMAGE_DIR = API_DIR / "static" / "heritage"
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

# IDs are confirmed from the user's live API response.
SITES = {
    11: ("Red Fort", "Red Fort Delhi India"),
    12: ("Qutub Minar", "Qutub Minar Delhi India"),
    13: ("Ajanta Caves", "Ajanta Caves Maharashtra India"),
    14: ("Ellora Caves", "Ellora Caves Kailasa temple India"),
    15: ("Fatehpur Sikri", "Fatehpur Sikri Uttar Pradesh India"),
    16: ("Khajuraho Temples", "Khajuraho temples Madhya Pradesh India"),
    17: ("Brihadeeswarar Temple", "Brihadeeswarar temple Thanjavur India"),
    18: ("Meenakshi Amman Temple", "Meenakshi Amman temple Madurai India"),
    19: ("Rani ki Vav", "Rani ki Vav Patan Gujarat India"),
    20: ("Jantar Mantar", "Jantar Mantar Jaipur India"),
    21: ("Mahabalipuram Monuments", "Shore Temple Mahabalipuram India"),
    22: ("Victoria Memorial", "Victoria Memorial Kolkata India"),
}

COMMONS_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "HeritageAI-image-installer/1.1 (personal educational project; contact: krishanvamsi91@gmail.com)"
REQUEST_DELAY_SECONDS = 12
_last_request_at = 0.0


def polite_urlopen(request: Request, timeout: int = 40):
    """Rate-limit requests and retry Wikimedia 429/5xx responses."""
    global _last_request_at
    for attempt in range(6):
        elapsed = time.time() - _last_request_at
        if elapsed < REQUEST_DELAY_SECONDS:
            time.sleep(REQUEST_DELAY_SECONDS - elapsed)
        try:
            response = urlopen(request, timeout=timeout)
            _last_request_at = time.time()
            return response
        except HTTPError as exc:
            _last_request_at = time.time()
            if exc.code not in (429, 500, 502, 503, 504) or attempt == 5:
                raise
            retry_after = exc.headers.get("Retry-After")
            try:
                wait_seconds = max(REQUEST_DELAY_SECONDS, int(retry_after))
            except (TypeError, ValueError):
                wait_seconds = min(120, 30 * (2 ** attempt))
            print(f"  Wikimedia rate limit/server response {exc.code}; waiting {wait_seconds}s...")
            time.sleep(wait_seconds)
    raise RuntimeError("Wikimedia request retries exhausted")


def commons_search(query: str) -> dict:
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"filetype:bitmap {query}",
        "gsrnamespace": 6,
        "gsrlimit": 10,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata",
        "iiurlwidth": 1400,
    }
    url = COMMONS_API + "?" + urlencode(params)
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with polite_urlopen(request, timeout=40) as response:
        return json.loads(response.read().decode("utf-8"))


def clean_filename(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_-]+", "_", value).strip("_")


def choose_result(data: dict, site_name: str):
    pages = (data.get("query") or {}).get("pages") or {}
    candidates = list(pages.values())

    # Prefer titles that contain distinctive words from the site's name.
    terms = [w.lower() for w in re.findall(r"[A-Za-z]+", site_name) if len(w) > 3]
    def score(page):
        title = page.get("title", "").lower()
        return sum(term in title for term in terms)

    candidates.sort(key=score, reverse=True)
    for page in candidates:
        info_list = page.get("imageinfo") or []
        if not info_list:
            continue
        info = info_list[0]
        thumb = info.get("thumburl") or info.get("url")
        if thumb and thumb.lower().split("?")[0].endswith((".jpg", ".jpeg", ".png", ".webp")):
            return page, info
    return None, None


def main():
    session = SessionLocal()
    try:
        updated = 0
        skipped = 0
        failed = []

        for site_id, (expected_name, query) in SITES.items():
            site = session.scalar(
                select(HeritageSite).where(HeritageSite.id == site_id)
            )
            if site is None:
                print(f"SKIP ID {site_id}: record not found")
                skipped += 1
                continue
            if site.name != expected_name:
                print(
                    f"SKIP ID {site_id}: expected {expected_name!r}, "
                    f"found {site.name!r}; refusing to update"
                )
                skipped += 1
                continue
            if site.image_url:
                print(f"KEEP: {site.name} already has {site.image_url}")
                skipped += 1
                continue

            try:
                data = commons_search(query)
                page, info = choose_result(data, site.name)
                if not info:
                    raise RuntimeError("No suitable image result returned by Commons")

                image_url = info.get("thumburl") or info.get("url")
                request = Request(image_url, headers={"User-Agent": USER_AGENT})
                with polite_urlopen(request, timeout=60) as response:
                    image_bytes = response.read()
                    content_type = response.headers.get("Content-Type", "").lower()

                if not content_type.startswith("image/") or len(image_bytes) < 20_000:
                    raise RuntimeError(
                        f"Unexpected image response ({content_type}, {len(image_bytes)} bytes)"
                    )

                suffix = ".png" if "png" in content_type else ".jpg"
                filename = f"{site_id}_{clean_filename(site.name)}{suffix}"
                destination = IMAGE_DIR / filename
                destination.write_bytes(image_bytes)

                local_url = f"http://10.106.37.61:8000/static/heritage/{filename}"
                site.image_url = local_url
                session.commit()
                updated += 1

                metadata = info.get("extmetadata") or {}
                license_name = metadata.get("LicenseShortName", {}).get("value", "Not stated")
                author = metadata.get("Artist", {}).get("value", "Not stated")
                print(f"ADDED: {site.name}")
                print(f"  Commons file: {page.get('title')}")
                print(f"  License: {license_name}")
                print(f"  Author: {re.sub('<[^>]+>', '', author)[:180]}")
                print(f"  Saved: {destination}")
            except (HTTPError, URLError, TimeoutError, OSError, ValueError, RuntimeError) as exc:
                session.rollback()
                failed.append((site.name, str(exc)))
                print(f"FAILED: {site.name}: {exc}")

        print("\n--- SUMMARY ---")
        print(f"Images added: {updated}")
        print(f"Records kept/skipped: {skipped}")
        print(f"Failures: {len(failed)}")
        for name, reason in failed:
            print(f"  - {name}: {reason}")
        print("\nReview the selected Commons file titles and licenses above.")
        print("If needed, add your contact email to USER_AGENT before rerunning.")
        print("If the API host IP changes, update the local_url base in this script.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
