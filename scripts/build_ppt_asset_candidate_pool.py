from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import io
import json
import math
import os
import re
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageStat


ALLOWED_SOURCE_DOMAINS = (
    "news.cgtn.com",
    "news.cn",
    "people.cn",
    "chinadaily.com.cn",
    "chinadailyhk.com",
    "chinamuseum.org.cn",
    "cctv.com",
    "scol.com.cn",
    "sanxingduiarchy.com",
    "jinshasitemuseum.com",
    "sxd.cn",
    "sxckg.com",
    "gov.cn",
    "gooood.cn",
    "archinect.com",
    "amazingarchitecture.com",
    "archaeology.org",
    "ichongqing.info",
    "eyeshenzhen.com",
    "sznews.com",
    "whb.cn",
    "visitancientshu.com",
    "cultureplus.asia",
    "pixabay.com",
    "hengqin.gov.cn",
    "cjn.cn",
    "thepaper.cn",
    "globaltimes.cn",
    "artstation.com",
    "scmp.com",
)

BLOCKED_TITLE_TERMS = (
    "stock photo",
    "stock photography",
    "etsy",
    "ebay",
    "youtube",
    "3d print",
    "3d model",
    "replica for sale",
    "private tour",
    "ticket",
)

FORMAT_EXTENSIONS = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "WEBP": ".webp",
}


def host_matches(host: str) -> bool:
    return any(host == item or host.endswith("." + item) for item in ALLOWED_SOURCE_DOMAINS)


def source_host(item: dict) -> str:
    try:
        return urllib.parse.urlparse(item["source"]).hostname.lower()
    except (AttributeError, TypeError, ValueError):
        return ""


def candidate_score(item: dict) -> float:
    host = source_host(item)
    area = min(int(item.get("width", 0)) * int(item.get("height", 0)), 12_000_000)
    score = math.log2(max(area, 1))
    if any(domain in host for domain in ("news.cn", "people.cn", "cgtn.com", "scol.com.cn")):
        score += 5
    if any(domain in host for domain in ("gooood.cn", "archinect.com", "amazingarchitecture.com")):
        score += 4
    title = str(item.get("title", "")).lower()
    if any(term in title for term in ("high resolution", "12k", "immersive", "digital", "museum", "exhibition")):
        score += 2
    ratio = int(item.get("width", 0)) / max(int(item.get("height", 1)), 1)
    if 1.35 <= ratio <= 2.0:
        score += 1.5
    return score


def choose_candidates(items: list[dict], per_query: int) -> list[dict]:
    grouped: dict[str, list[dict]] = {}
    seen_urls: set[str] = set()
    for item in items:
        image_url = str(item.get("image", ""))
        title = str(item.get("title", "")).lower()
        host = source_host(item)
        width = int(item.get("width", 0))
        height = int(item.get("height", 0))
        if not image_url or image_url in seen_urls or not host_matches(host):
            continue
        if width < 1000 or height < 700 or any(term in title for term in BLOCKED_TITLE_TERMS):
            continue
        seen_urls.add(image_url)
        item = dict(item)
        item["sourceHost"] = host
        grouped.setdefault(str(item.get("query", "other")), []).append(item)

    selected: list[dict] = []
    for query, group in grouped.items():
        group.sort(key=candidate_score, reverse=True)
        selected.extend(group[:per_query])
    return selected


def fetch_bytes(url: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
    )
    with urllib.request.urlopen(request, timeout=35) as response:
        data = response.read(20 * 1024 * 1024)
    if len(data) < 12_000:
        raise ValueError("downloaded payload is too small")
    return data


def download_candidate(index_and_item: tuple[int, dict], output_dir: Path) -> dict | None:
    index, item = index_and_item
    try:
        data = fetch_bytes(item["image"])
        with Image.open(io.BytesIO(data)) as image:
            image.load()
            width, height = image.size
            if width < 900 or height < 600 or width / height > 3.2 or height / width > 3.2:
                return None
            gray = ImageOps.grayscale(image.resize((160, 120)))
            if ImageStat.Stat(gray).stddev[0] < 16:
                return None
            image_format = image.format or "JPEG"
        extension = FORMAT_EXTENSIONS.get(image_format, ".img")
        candidate_id = f"C{index:03d}"
        target = output_dir / f"{candidate_id}{extension}"
        target.write_bytes(data)
        result = dict(item)
        result.update(
            {
                "candidateId": candidate_id,
                "file": target.name,
                "actualWidth": width,
                "actualHeight": height,
                "sha256": hashlib.sha256(data).hexdigest(),
            }
        )
        return result
    except Exception as error:
        print(f"SKIP {index:03d}: {error}")
        return None


def load_font(size: int):
    candidates = (
        "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/arial.ttf",
    )
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def build_contact_sheets(records: list[dict], output_dir: Path, page_size: int = 24) -> None:
    columns = 4
    thumb_width = 340
    thumb_height = 220
    label_height = 42
    margin = 18
    font = load_font(20)
    small_font = load_font(14)
    page_count = math.ceil(len(records) / page_size)
    for page_index in range(page_count):
        page_records = records[page_index * page_size : (page_index + 1) * page_size]
        rows = math.ceil(len(page_records) / columns)
        sheet = Image.new(
            "RGB",
            (
                columns * (thumb_width + margin) + margin,
                rows * (thumb_height + label_height + margin) + margin,
            ),
            "#151812",
        )
        draw = ImageDraw.Draw(sheet)
        for item_index, item in enumerate(page_records):
            row, column = divmod(item_index, columns)
            x = margin + column * (thumb_width + margin)
            y = margin + row * (thumb_height + label_height + margin)
            with Image.open(output_dir / item["file"]) as image:
                image = image.convert("RGB")
                thumb = ImageOps.fit(image, (thumb_width, thumb_height), method=Image.Resampling.LANCZOS)
            sheet.paste(thumb, (x, y))
            draw.rectangle((x, y + thumb_height, x + thumb_width, y + thumb_height + label_height), fill="#efe8d4")
            draw.text((x + 8, y + thumb_height + 4), item["candidateId"], fill="#163e2d", font=font)
            dimensions = f"{item['actualWidth']}x{item['actualHeight']}"
            draw.text((x + 85, y + thumb_height + 9), dimensions, fill="#6d674f", font=small_font)
        sheet.save(output_dir / f"contact-sheet-{page_index + 1:02d}.jpg", quality=90)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input",
        default=str(Path(tempfile.gettempdir()) / "sanxingdui-ppt-candidates.json"),
    )
    parser.add_argument(
        "--output",
        default=str(Path(tempfile.gettempdir()) / "sanxingdui-ppt-candidate-pool"),
    )
    parser.add_argument("--per-query", type=int, default=10)
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    raw_items = json.loads(Path(args.input).read_text(encoding="utf-8-sig"))
    selected = choose_candidates(raw_items, args.per_query)
    print(f"Selected {len(selected)} candidates for download")

    records: list[dict] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        futures = [
            executor.submit(download_candidate, pair, output_dir)
            for pair in enumerate(selected, start=1)
        ]
        for future in concurrent.futures.as_completed(futures):
            record = future.result()
            if record:
                records.append(record)

    records.sort(key=lambda item: item["candidateId"])
    (output_dir / "_candidates.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    build_contact_sheets(records, output_dir)
    print(f"Downloaded {len(records)} valid candidates to {output_dir}")


if __name__ == "__main__":
    main()
