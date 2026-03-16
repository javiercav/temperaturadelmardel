"""
update_data.py
Scrapes seatemperature.info for Mar del Plata sea temperature data,
updates data.json with any new days since the last embedded day,
and recalculates derived statistics (monthly means, annual means, trend).
"""
import json, re, time, datetime, sys
from pathlib import Path
import urllib.request, urllib.parse
import numpy as np

DATA_FILE = Path(__file__).parent.parent / "data.json"

MONTH_NAMES = [
    "january","february","march","april","may","june",
    "july","august","september","october","november","december"
]
MONTH_DAYS = [31,28,31,30,31,30,31,31,30,31,30,31]

PROXIES = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
]

def fetch_url(url, retries=3):
    """Fetch a URL directly (server-side, no CORS issues)."""
    headers = {"User-Agent": "Mozilla/5.0 (compatible; TempBot/1.0)"}
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.read().decode("utf-8")
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(3)
            else:
                raise RuntimeError(f"Failed to fetch {url}: {e}")

def month_day_to_idx(month_0, day_1):
    """Convert 0-based month + 1-based day to 0-based day-of-year index (non-leap)."""
    idx = day_1 - 1
    for m in range(month_0):
        idx += MONTH_DAYS[m]
    return min(364, max(0, idx))

def parse_monthly_page(html, year):
    """
    Parse daily temperatures for `year` from a monthly page.
    Returns {day_number: temp_float}.
    """
    result = {}
    # Find all table rows that look like: "N Month | TEMP°C | ..."
    # Pattern: digit(s) followed by month name, then temperatures in °C
    rows = re.findall(
        r'<tr[^>]*>([\s\S]*?)</tr>',
        html, re.IGNORECASE
    )
    year_str = str(year)
    
    # Find tables that contain this year in their header
    tables = re.findall(r'<table[^>]*>([\s\S]*?)</table>', html, re.IGNORECASE)
    for table in tables:
        # Get all rows
        trows = re.findall(r'<tr[^>]*>([\s\S]*?)</tr>', table, re.IGNORECASE)
        if not trows:
            continue
        # Find header row to get year column index
        header_cells = re.findall(r'<t[hd][^>]*>([\s\S]*?)</t[hd]>', trows[0], re.IGNORECASE)
        header_texts = [re.sub(r'<[^>]+>', '', c).strip() for c in header_cells]
        if year_str not in header_texts:
            continue
        year_col = header_texts.index(year_str)
        # Parse data rows
        for row in trows[1:]:
            cells = re.findall(r'<t[hd][^>]*>([\s\S]*?)</t[hd]>', row, re.IGNORECASE)
            cell_texts = [re.sub(r'<[^>]+>', '', c).strip() for c in cells]
            if not cell_texts:
                continue
            day_match = re.match(r'^(\d{1,2})', cell_texts[0])
            if not day_match:
                continue
            day = int(day_match.group(1))
            if year_col < len(cell_texts):
                temp_match = re.search(r'([\d.]+)', cell_texts[year_col])
                if temp_match:
                    result[day] = float(temp_match.group(1))
    return result

def parse_homepage(html):
    """
    Parse today's and yesterday's temperature from the homepage.
    Returns {(month_0, day_1): temp_float} for year 2026.
    """
    result = {}
    MON_MAP = {m: i for i, m in enumerate(MONTH_NAMES)}
    # Match "DD Month YYYY ... NNN.N°C"
    for m in re.finditer(
        r'(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})[^\d]+([\d.]+)°C',
        html, re.IGNORECASE
    ):
        day, mon_str, yr, temp = int(m.group(1)), m.group(2).lower(), int(m.group(3)), float(m.group(4))
        if yr == 2026 and mon_str in MON_MAP and 0 < temp < 40:
            result[(MON_MAP[mon_str], day)] = temp
    return result

def recalc_stats(data):
    """
    Recompute annual_means, monthly_means for all years,
    and trend line for complete years (not current year if incomplete).
    Updates data dict in place.
    """
    years = data["years"]
    month_days = MONTH_DAYS
    
    # Rebuild monthly_means from daily data (yd)
    for yr in years:
        arr = data["yd"][yr]
        m_means = []
        d = 0
        for mi, mdays in enumerate(month_days):
            vals = [arr[d+di] for di in range(mdays) if arr[d+di] is not None]
            m_means.append(round(sum(vals)/len(vals), 2) if vals else None)
            d += mdays
        data["monthly_means"][yr] = m_means
    
    # Annual means — only report if year has data
    annual = []
    for yr in years:
        vals = [v for v in data["yd"][yr] if v is not None]
        annual.append(round(sum(vals)/len(vals), 2) if vals else None)
    data["annual_means"] = annual
    
    # Trend: only complete years (all 365 days filled, or simply not current year)
    today_year = str(datetime.date.today().year)
    complete = [yr for yr in years if yr != today_year and all(v is not None for v in data["yd"][yr])]
    if len(complete) >= 2:
        data["trend_years"] = complete
        x = [int(y) for y in complete]
        y_vals = [data["annual_means"][years.index(yr)] for yr in complete]
        # Linear regression
        n = len(x)
        mx, my = sum(x)/n, sum(y_vals)/n
        num = sum((xi-mx)*(yi-my) for xi,yi in zip(x,y_vals))
        den = sum((xi-mx)**2 for xi in x)
        slope = num/den if den else 0
        intercept = my - slope*mx
        data["trend_vals"] = [round(intercept + slope*xi, 3) for xi in x]
        data["slope_decade"] = round(slope*10, 3)
    
    return data

def main():
    print(f"[{datetime.datetime.now().isoformat()}] Starting update...")
    
    # Load existing data
    with open(DATA_FILE, encoding="utf-8") as f:
        data = json.load(f)
    
    last_idx = data.get("last_embedded_idx", 71)
    years = data["years"]
    
    # Ensure yd keys are strings
    yd = data["yd"]
    
    today = datetime.date.today()
    # We update year 2026 and also the current year if different
    target_year = today.year
    target_yr_str = str(target_year)
    
    if target_yr_str not in years:
        # New year! Add it.
        years.insert(0, target_yr_str)
        yd[target_yr_str] = [None] * 365
        data["monthly_means"][target_yr_str] = [None] * 12
        data["annual_means"].insert(0, None)
        print(f"  Added new year {target_yr_str}")
    
    # Determine which months to fetch
    # Find last day with data for target year
    arr = yd[target_yr_str]
    known_last = max(
        (i for i, v in enumerate(arr) if v is not None),
        default=last_idx if target_yr_str == "2026" else -1
    )
    
    # Start fetching from the month that contains known_last
    start_day = 0
    start_month = 0
    for mi, md in enumerate(MONTH_DAYS):
        if start_day + md - 1 >= known_last:
            start_month = mi
            break
        start_day += md
    
    end_month = today.month - 1  # 0-based, current month
    
    months_to_fetch = list(range(start_month, end_month + 1))
    print(f"  Fetching months {[MONTH_NAMES[m] for m in months_to_fetch]} for {target_yr_str}")
    
    new_days = 0
    
    # Fetch each month page
    for mi in months_to_fetch:
        url = f"https://seatemperature.info/{MONTH_NAMES[mi]}/mar-del-plata-water-temperature.html"
        try:
            html = fetch_url(url)
            temps = parse_monthly_page(html, target_year)
            for day, temp in temps.items():
                idx = month_day_to_idx(mi, day)
                day_date = datetime.date(target_year, mi+1, day)
                if idx > known_last and day_date < today:
                    yd[target_yr_str][idx] = temp
                    new_days += 1
            print(f"    {MONTH_NAMES[mi]}: found {len(temps)} days")
            time.sleep(1)
        except Exception as e:
            print(f"    WARNING: could not fetch {MONTH_NAMES[mi]}: {e}")
    
    # Also fetch homepage for today and yesterday
    try:
        homepage = fetch_url("https://seatemperature.info/mar-del-plata-water-temperature.html")
        hp_data = parse_homepage(homepage)
        for (mon_0, day_1), temp in hp_data.items():
            idx = month_day_to_idx(mon_0, day_1)
            day_date = datetime.date(target_year, mon_0+1, day_1)
            if idx > known_last and day_date <= today:
                yd[target_yr_str][idx] = temp
                new_days += 1
        print(f"    Homepage: found {len(hp_data)} recent entries")
    except Exception as e:
        print(f"    WARNING: could not fetch homepage: {e}")
    
    if new_days == 0:
        print("  No new days found. data.json unchanged.")
        return
    
    print(f"  Added {new_days} new day(s). Recalculating stats...")
    
    # Update last_embedded_idx to reflect new data
    arr = yd[target_yr_str]
    new_last = max(i for i, v in enumerate(arr) if v is not None)
    data["last_embedded_idx"] = new_last
    print(f"  New last day: index {new_last} = {data['dl'][new_last]}")
    
    # Recalculate derived stats
    data = recalc_stats(data)
    
    # Save
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",",":"))
    
    size = DATA_FILE.stat().st_size / 1024
    print(f"  Saved data.json ({size:.1f} KB)")
    print(f"[{datetime.datetime.now().isoformat()}] Done.")

if __name__ == "__main__":
    main()
