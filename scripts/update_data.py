#!/usr/bin/env python3
"""
update_data.py — Mar del Plata sea temperature data updater
Runs daily via GitHub Actions. Fetches new data from seatemperature.info
and updates data/sea_data.json with any days newer than the last stored value.
"""

import json
import datetime
import sys
import time
import os
import re
import numpy as np
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Installing dependencies...")
    os.system("pip install requests beautifulsoup4 numpy -q")
    import requests
    from bs4 import BeautifulSoup

# ── Constants ─────────────────────────────────────────────────────────────────

DATA_FILE = Path(__file__).parent.parent / "data" / "sea_data.json"
BASE_URL   = "https://seatemperature.info"
MONTHS_URL = [
    "january","february","march","april","may","june",
    "july","august","september","october","november","december"
]
MONTH_DAYS = [31,28,31,30,31,30,31,31,30,31,30,31]
HEADERS    = {"User-Agent": "Mozilla/5.0 (compatible; sea-temp-updater/1.0)"}
CURRENT_YEAR = 2026  # increment each January


# ── Helpers ───────────────────────────────────────────────────────────────────

def month_day_to_idx(month_0: int, day: int) -> int:
    """Convert 0-based month + 1-based day to 0-based day-of-year index."""
    idx = day - 1
    for i in range(month_0):
        idx += MONTH_DAYS[i]
    return min(364, idx)


def last_data_idx(yd: list) -> int:
    """Return the index of the last non-null entry in a year's daily array."""
    last = -1
    for i, v in enumerate(yd):
        if v is not None:
            last = i
    return last


def fetch_url(url: str, retries: int = 3) -> str | None:
    """Fetch a URL, retrying on failure."""
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=15)
            if r.ok:
                return r.text
            print(f"  HTTP {r.status_code} for {url}")
        except Exception as e:
            print(f"  Attempt {attempt+1} failed: {e}")
        if attempt < retries - 1:
            time.sleep(3)
    return None


def parse_monthly_page(html: str, year: int) -> dict[int, float]:
    """
    Parse a seatemperature.info monthly page and return {day: temp} for the given year.
    The site uses <td> for all cells including headers.
    """
    soup = BeautifulSoup(html, "html.parser")
    result = {}
    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        if len(rows) < 2:
            continue
        # Detect header row — find column index for the requested year
        header_cells = rows[0].find_all(["th", "td"])
        year_col = next(
            (i for i, c in enumerate(header_cells) if c.get_text(strip=True) == str(year)),
            None
        )
        if year_col is None:
            continue
        # Parse data rows
        for row in rows[1:]:
            cells = row.find_all("td")
            if len(cells) < 2:
                continue
            day_text = cells[0].get_text(strip=True)
            m = re.match(r"^(\d+)", day_text)
            if not m:
                continue
            day_num = int(m.group(1))
            if not (1 <= day_num <= 31):
                continue
            if year_col < len(cells):
                temp_text = cells[year_col].get_text(strip=True)
                t = re.search(r"([\d.]+)", temp_text)
                if t:
                    result[day_num] = float(t.group(1))
    return result


def parse_homepage(html: str, year: int) -> dict[tuple[int,int], float]:
    """
    Parse the main page for today/yesterday temperatures.
    Returns {(month_0, day): temp}.
    """
    result = {}
    MONTHS_EN = {m: i for i, m in enumerate([
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ])}
    # Pattern: "15 March 2026\ntoday temp\n21.5°C"
    pattern = re.compile(
        r"(\d{1,2})\s+(January|February|March|April|May|June|"
        r"July|August|September|October|November|December)\s+(\d{4})"
        r"[^\d]+([\d.]+)°C",
        re.IGNORECASE
    )
    for m in pattern.finditer(html):
        day, month_str, yr, temp = int(m[1]), m[2].capitalize(), int(m[3]), float(m[4])
        if yr == year and month_str in MONTHS_EN and 0 < temp < 40:
            result[(MONTHS_EN[month_str], day)] = temp
    return result


def recalc_stats(sea_data: dict) -> None:
    """
    Recompute monthly_means, monthly_stats, annual_means, trend, and daily_stats
    from the updated daily data. Modifies sea_data in place.
    Only uses years with complete data (all 365 days non-null) for statistics.
    """
    yd    = sea_data["daily"]["yd"]
    dl    = sea_data["daily"]["dl"]
    years = sea_data["viz"]["years"]   # newest first

    # ── Monthly means per year ──
    month_nums = []   # 0-based month index for each day-of-year
    acc = 0
    for mi, days in enumerate(MONTH_DAYS):
        for _ in range(days):
            month_nums.append(mi)
        acc += days

    monthly_means = {}
    for yr in years:
        arr = yd[yr]
        buckets = [[] for _ in range(12)]
        for i, v in enumerate(arr):
            if v is not None:
                buckets[month_nums[i]].append(v)
        monthly_means[yr] = [
            round(sum(b)/len(b), 2) if b else None for b in buckets
        ]
    sea_data["viz"]["monthly_means"] = monthly_means

    # ── Annual means (complete years only, exclude current partial year) ──
    def is_complete(yr):
        return all(v is not None for v in yd[yr])

    complete_years = sorted([yr for yr in years if is_complete(yr)])
    annual_means_map = {}
    for yr in years:
        vals = [v for v in yd[yr] if v is not None]
        annual_means_map[yr] = round(sum(vals)/len(vals), 2) if vals else None

    sea_data["viz"]["annual_means"] = [annual_means_map[yr] for yr in years]

    # ── Trend (complete years only) ──
    cx = np.array([int(y) for y in complete_years])
    cy = np.array([annual_means_map[y] for y in complete_years])
    slope, intercept = np.polyfit(cx, cy, 1)
    sea_data["viz"]["trend_vals"]   = [round(intercept + slope*int(y), 3) for y in complete_years]
    sea_data["viz"]["trend_years"]  = complete_years
    sea_data["viz"]["slope_decade"] = round(slope * 10, 3)

    # ── Monthly stats (min/max/mean across complete years) ──
    monthly_stats = []
    for mi in range(12):
        vals = [monthly_means[yr][mi] for yr in complete_years
                if monthly_means[yr][mi] is not None]
        if vals:
            monthly_stats.append({
                "min":  round(min(vals), 2),
                "max":  round(max(vals), 2),
                "mean": round(sum(vals)/len(vals), 2)
            })
        else:
            monthly_stats.append({"min": None, "max": None, "mean": None})
    sea_data["viz"]["monthly_stats"] = monthly_stats

    # ── Daily stats [min, max, mean, p25, p75, min_yr, max_yr] ──
    # Use complete years for historical baseline
    daily_stats = []
    for di in range(365):
        yr_vals = [(yr, yd[yr][di]) for yr in complete_years if yd[yr][di] is not None]
        if yr_vals:
            arr = np.array([v for _, v in yr_vals])
            max_yr = max(yr_vals, key=lambda x: x[1])[0]
            min_yr = min(yr_vals, key=lambda x: x[1])[0]
            daily_stats.append([
                round(float(arr.min()), 2),
                round(float(arr.max()), 2),
                round(float(arr.mean()), 2),
                round(float(np.percentile(arr, 25)), 2),
                round(float(np.percentile(arr, 75)), 2),
                min_yr, max_yr
            ])
        else:
            daily_stats.append([None, None, None, None, None, None, None])
    sea_data["daily"]["ds"] = daily_stats


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    # Argentina is UTC-3 (no DST currently)
    now_arg = datetime.datetime.utcnow() - datetime.timedelta(hours=3)
    today   = now_arg.date()
    print(f"[update_data.py] Running at {now_arg.isoformat()} ARG (UTC-3)")
    print(f"[update_data.py] Today (ARG): {today}")

    # Load existing data
    if not DATA_FILE.exists():
        print(f"ERROR: {DATA_FILE} not found.")
        sys.exit(1)

    with open(DATA_FILE) as f:
        sea_data = json.load(f)

    yd   = sea_data["daily"]["yd"]
    yr   = str(CURRENT_YEAR)

    # Ensure current year array exists
    if yr not in yd:
        yd[yr] = [None] * 365
        if yr not in sea_data["viz"]["years"]:
            sea_data["viz"]["years"].insert(0, yr)

    last_idx = last_data_idx(yd[yr])
    print(f"Last stored day for {yr}: index {last_idx} ({sea_data['daily']['dl'][last_idx] if last_idx >= 0 else 'none'})")

    # Determine which months to fetch
    start_month = 0
    acc = 0
    for mi, days in enumerate(MONTH_DAYS):
        acc += days
        if last_idx < acc:
            start_month = mi
            break

    end_month = today.month - 1  # 0-based, capped at current month

    if start_month > end_month:
        print("No new months to fetch.")
        return

    months_to_fetch = list(range(start_month, end_month + 1))
    print(f"Fetching months: {[MONTHS_URL[m] for m in months_to_fetch]}")

    new_count = 0

    # Fetch monthly pages
    for mi in months_to_fetch:
        url = f"{BASE_URL}/{MONTHS_URL[mi]}/mar-del-plata-water-temperature.html"
        print(f"  Fetching {url} ...")
        html = fetch_url(url)
        if not html:
            print(f"  FAILED to fetch {MONTHS_URL[mi]}")
            continue
        temps = parse_monthly_page(html, CURRENT_YEAR)
        for day, temp in temps.items():
            idx = month_day_to_idx(mi, day)
            day_date = datetime.date(CURRENT_YEAR, mi + 1, day)
            if idx > last_idx and day_date < today:
                yd[yr][idx] = temp
                new_count += 1
                print(f"    + {sea_data['daily']['dl'][idx]} = {temp}°C")
        time.sleep(1)  # be polite

    # Also fetch homepage for today and yesterday
    print(f"  Fetching homepage for today/yesterday ...")
    home_html = fetch_url(f"{BASE_URL}/mar-del-plata-water-temperature.html")
    if home_html:
        parsed = parse_homepage(home_html, CURRENT_YEAR)
        for (mi, day), temp in parsed.items():
            idx = month_day_to_idx(mi, day)
            day_date = datetime.date(CURRENT_YEAR, mi + 1, day)
            if idx > last_idx and day_date <= today:
                yd[yr][idx] = temp
                new_count += 1
                print(f"    + (homepage) {sea_data['daily']['dl'][idx]} = {temp}°C")

    if new_count == 0:
        print("No new data found. JSON unchanged.")
        return

    print(f"\nAdded {new_count} new day(s). Recomputing statistics...")
    recalc_stats(sea_data)

    # Update metadata
    new_last = last_data_idx(yd[yr])
    sea_data["meta"]["last_updated"] = today.isoformat()
    sea_data["meta"]["last_embedded_idx"] = new_last

    # Write updated JSON (compact)
    with open(DATA_FILE, "w") as f:
        json.dump(sea_data, f, separators=(",", ":"))

    kb = DATA_FILE.stat().st_size / 1024
    print(f"Saved {DATA_FILE} ({kb:.1f} KB). Last idx now: {new_last} ({sea_data['daily']['dl'][new_last]})")


if __name__ == "__main__":
    main()
