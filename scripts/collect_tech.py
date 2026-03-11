#!/usr/bin/env python3
"""
Collecte automatique — Actualités Tech & Innovation
Sources EN : The Verge, TechCrunch, Ars Technica, MIT Technology Review
Sources FR : 01net, Le Monde Informatique, Silicon.fr, Numerama, Next.ink
"""
import feedparser
import json, os, re, time, urllib.request
from datetime import datetime

RSS_SOURCES = [
    # ── Sources anglaises ──────────────────────────────────────────────────────
    {"url": "https://www.theverge.com/rss/index.xml",                "source": "The Verge"},
    {"url": "https://techcrunch.com/feed/",                          "source": "TechCrunch"},
    {"url": "https://feeds.arstechnica.com/arstechnica/index",       "source": "Ars Technica"},
    {"url": "https://www.technologyreview.com/feed/",                "source": "MIT Tech Review"},
    # ── Sources françaises ────────────────────────────────────────────────────
    {"url": "https://www.01net.com/feed/",                           "source": "01net"},
    {"url": "https://www.lemondeinformatique.fr/flux-rss-actualite-informatique.xml", "source": "Le Monde Informatique"},
    {"url": "https://www.silicon.fr/feed",                           "source": "Silicon.fr"},
    {"url": "https://www.numerama.com/feed/",                        "source": "Numerama"},
    {"url": "https://next.ink/feed/",                                "source": "Next.ink"},
]

CATEGORIES = {
    "IA & Modèles":       ["openai","anthropic","claude","gpt","gemini","llama","mistral","deepseek",
                           "ai model","llm","large language","benchmark","artificial intelligence",
                           "machine learning","neural","foundation model","generative ai","copilot ai",
                           "sora","dall-e","stable diffusion","midjourney","hugging face","o3","o4"],
    "Big Tech":           ["apple","google","microsoft","meta","amazon","nvidia","tesla","alphabet",
                           "elon musk","zuckerberg","satya nadella","tim cook","sundar pichai",
                           "andy jassy","jensen huang"],
    "Startups & VC":      ["startup","raises","funding","series a","series b","series c","seed round",
                           "valuation","acquisition","ipo","unicorn","billion","million funding",
                           "venture capital","y combinator"],
    "Open Source":        ["open source","open-source","linux","apache","mozilla","github","gitlab",
                           "community","open weight","open model","llama","mistral"],
    "Hardware":           ["chip","gpu","cpu","quantum","semiconductor","nvidia","amd","intel","arm",
                           "data center","server","h100","gb200","tpu","wafer","fab","tsmc"],
    "Cloud & Infra":      ["aws","azure","gcp","google cloud","cloud computing","kubernetes","docker",
                           "data center","infrastructure","serverless","edge computing"],
    "Sécurité":           ["vulnerability","cve","breach","hack","ransomware","malware","phishing",
                           "security","zero-day","exploit","cyberattack","scam","deepfake"],
    "Numérique & Société":["regulation","antitrust","policy","job","employment","layoff","ethics",
                           "bias","society","geopolit","doj","ftc","eu","ban","congress","senate",
                           "social media","misinformation","deepfake","privacy"],
}

ROOT        = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE   = os.path.join(ROOT, "data", "tech.json")
OUT_FILE    = os.path.join(ROOT, "tech-auto.js")
HEADERS     = {"User-Agent": "VeilleBot/1.0", "Accept": "application/xml,text/xml,*/*"}

# Mots-clés pour filtrer uniquement les articles pertinents (éviter le bruit)
RELEVANCE_KEYWORDS = [
    # Anglais
    "ai","openai","anthropic","google","apple","microsoft","meta","amazon","nvidia",
    "startup","funding","chip","gpu","cloud","model","llm","robot","quantum","hack",
    "breach","regulation","antitrust","acquisition","ipo","open source","data center",
    # Français
    "intelligence artificielle","numérique","données","technologie","logiciel",
    "cybersécurité","algorithme","vie privée","innovation","informatique","réseau",
    "mobile","internet","application","sécurité","ia","modèle","deepfake","startup",
    "financement","rachat","cloud","robot","quantique","open source","big data",
]

def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()

def parse_date(t):
    if not t: return datetime.now().strftime("%Y-%m-%d")
    if isinstance(t, tuple):
        try: return datetime(*t[:6]).strftime("%Y-%m-%d")
        except: pass
    m = re.search(r"(\d{4}-\d{2}-\d{2})", str(t))
    return m.group(1) if m else datetime.now().strftime("%Y-%m-%d")

def clean(text):
    if not text: return ""
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()[:350]

def is_relevant(title, desc):
    text = (title + " " + (desc or "")).lower()
    return any(kw in text for kw in RELEVANCE_KEYWORDS)

def categorize(title, desc):
    text = (title + " " + (desc or "")).lower()
    scores = {cat: sum(1 for kw in kws if kw in text) for cat, kws in CATEGORIES.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "Numérique & Société"

def fetch_feed(src):
    items = []
    try:
        raw = fetch(src["url"])
        d = feedparser.parse(raw)
        for entry in d.entries[:30]:
            title = clean(entry.get("title", ""))
            url   = entry.get("link", "").strip()
            date  = parse_date(entry.get("published_parsed") or entry.get("updated_parsed"))
            desc  = clean(entry.get("summary", ""))
            if title and url and is_relevant(title, desc):
                items.append({"title": title, "url": url, "date": date, "desc": desc})
            if len(items) >= 15: break
        print(f"  ✓ {src['source']}: {len(items)} items pertinents")
    except Exception as e:
        print(f"  ✗ {src['source']}: {e}")
    return items

def load():
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    return json.load(open(DATA_FILE, encoding="utf-8")) if os.path.exists(DATA_FILE) else []

def save(articles):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)

def write_js(articles):
    now = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    def esc(s): return s.replace("\\","\\\\").replace('"','\\"')
    lines = [
        "// Généré automatiquement par GitHub Actions — ne pas modifier.",
        f"// Dernière collecte : {now}",
        "window.AUTO_TECH = ["
    ]
    for a in articles:
        lines += [
            "  {",
            f'    id: "{a["id"]}",',
            f'    title: "{esc(a["title"])}",',
            f'    url: "{a["url"]}",',
            f'    source: "{a["source"]}",',
            f'    date: "{a["date"]}",',
            f'    cat: "{a["cat"]}",',
            f'    desc: "{esc(a.get("desc",""))}",',
            "    auto: true",
            "  },"
        ]
    lines += ["];", f'window.AUTO_TECH_UPDATED = "{now}";', ""]
    open(OUT_FILE, "w", encoding="utf-8").write("\n".join(lines))
    print(f"  ✓ tech-auto.js : {len(articles)} articles")

def main():
    existing = load()
    seen = {a["url"] for a in existing}
    ts, idx, new_items = int(time.time()), 0, []
    for src in RSS_SOURCES:
        for item in fetch_feed(src):
            if item["url"] not in seen:
                new_items.append({
                    "id": f"tech-{ts}-{idx}",
                    "title": item["title"], "url": item["url"],
                    "source": src["source"], "date": item["date"],
                    "cat": categorize(item["title"], item["desc"]),
                    "desc": item["desc"], "auto": True,
                })
                seen.add(item["url"]); idx += 1
    all_articles = sorted(new_items + existing, key=lambda x: x.get("date",""), reverse=True)[:80]
    save(all_articles)
    write_js(all_articles)
    print(f"\n  Total : {len(all_articles)} articles ({len(new_items)} nouveaux)")

if __name__ == "__main__":
    main()
