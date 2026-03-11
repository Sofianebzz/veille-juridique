#!/usr/bin/env python3
"""
Collecte automatique — Veille Juridique
Sources : CNIL, EDPB, ANSSI, Legalis, ARCEP, ARCOM, EUR-Lex, Lextenso, Village Justice
"""
import feedparser
import json, os, re, time
from datetime import datetime

RSS_SOURCES = [
    {"url": "https://www.cnil.fr/fr/rss.xml",                                                                         "source": "CNIL"},
    {"url": "https://www.edpb.europa.eu/feed/news_en",                                                                "source": "EDPB"},
    {"url": "https://cyber.gouv.fr/actualites/rss/",                                                                  "source": "ANSSI"},
    {"url": "https://www.legalis.net/feed",                                                                           "source": "Legalis"},
    {"url": "https://www.arcep.fr/flux-rss",                                                                          "source": "ARCEP"},
    {"url": "https://www.arcom.fr/rss.xml",                                                                           "source": "ARCOM"},
    {"url": "https://eur-lex.europa.eu/oj/daily-view/L-series/rss.xml",                                               "source": "EUR-Lex"},
    {"url": "https://www.labase-lextenso.fr/rss?revue=DNU",                                                           "source": "Lextenso"},
    {"url": "https://www.village-justice.com/articles/rss.php?id_rubrique=5",                                         "source": "Village Justice"},
]

CATEGORIES = {
    "RGPD":         ["rgpd","gdpr","données personnelles","personal data","dpo","cookies","consentement",
                     "consent","privacy","protection des données","data protection","cnil","effacement",
                     "erasure","portabilité","rectification","kaspr","rejeu","session replay","tables"],
    "IA":           ["intelligence artificielle","artificial intelligence","ai act","algorithme","algorithm",
                     "machine learning","llm","generative","modèle d'ia","ia générative","generative ai",
                     "paname","système d'ia","deepfake","deepseek"],
    "Cybersécurité":["cyber","nis2","nis 2","anssi","sécurité","securite","security","attaque","ransomware",
                     "malware","breach","incident","vulnér","csirt","cert","résilience","resilience","g7",
                     "remédiation","mooc","collectivité","dora"],
    "Plateformes":  ["dma","dsa","plateforme","platform","gatekeeper","meta","google","apple","amazon",
                     "tiktok","twitter","facebook","instagram","whatsapp","shein","vlop","omnibus",
                     "digital markets","digital services"],
    "PI numérique": ["propriété intellectuelle","brevet","trademark","copyright","droit d'auteur","marque"],
    "Contrats IT":  ["contrat","contract","cloud","saas","outsourcing","clause","sous-traitant","processor"],
    "Jurisprudence":["arrêt","jugement","cjue","cour de justice","tribunal","décision","sanction","amende",
                     "condamn","sanction","délibération"],
    "International":["adequacy","adéquation","sccs","ccpa","chine","china","états-unis","brésil","brazil",
                     "transfert international","g7","bcr"],
}

ROOT      = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(ROOT, "data", "veille.json")
OUT_FILE  = os.path.join(ROOT, "veille-auto.js")

def parse_date(t):
    if not t: return datetime.now().strftime("%Y-%m-%d")
    s = " ".join(str(x) for x in t[:6]) if isinstance(t, tuple) else str(t)
    m = re.search(r"(\d{4}-\d{2}-\d{2})", s)
    return m.group(1) if m else datetime.now().strftime("%Y-%m-%d")

def clean(text):
    if not text: return ""
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()[:350]

def categorize(title, desc):
    text = (title + " " + (desc or "")).lower()
    scores = {cat: sum(1 for kw in kws if kw in text) for cat, kws in CATEGORIES.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "RGPD"

def fetch_feed(src):
    items = []
    try:
        d = feedparser.parse(src["url"], agent="Mozilla/5.0 (VeilleBot/2.0)")
        if d.bozo and not d.entries:
            raise Exception(str(d.bozo_exception))
        for entry in d.entries[:20]:
            title = clean(entry.get("title", ""))
            url   = entry.get("link", "").strip()
            date  = parse_date(entry.get("published_parsed") or entry.get("updated_parsed"))
            desc  = clean(entry.get("summary", ""))
            if title and url:
                items.append({"title": title, "url": url, "date": date, "desc": desc})
        print(f"  ✓ {src['source']}: {len(items)} items")
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
        "window.AUTO_VEILLE = ["
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
    lines += ["];", f'window.AUTO_VEILLE_UPDATED = "{now}";', ""]
    open(OUT_FILE, "w", encoding="utf-8").write("\n".join(lines))
    print(f"  ✓ veille-auto.js : {len(articles)} articles")

def main():
    existing = load()
    seen = {a["url"] for a in existing}
    ts, idx, new_items = int(time.time()), 0, []
    for src in RSS_SOURCES:
        for item in fetch_feed(src):
            if item["url"] not in seen:
                new_items.append({
                    "id": f"auto-{ts}-{idx}",
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
