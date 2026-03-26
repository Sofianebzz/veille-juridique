#!/usr/bin/env python3
"""
Collecte automatique — Veille Juridique
Sources : CNIL, EDPB, ANSSI, Legalis, ARCOM, EUR-Lex, Lextenso
"""
import feedparser
import json, os, re, time
from datetime import datetime

DGCCRF_KEYWORDS = [
    "dsa", "dma", "numérique", "numerique", "digital", "en ligne", "online",
    "plateforme", "marketplace", "e-commerce", "pratique déloyale", "pratique trompeuse",
    "pratique commerciale", "influenceur", "dark pattern", "abonnement", "résiliation",
    "données", "algorithme", "ia", "intelligence artificielle", "deepfake",
    "contrefaçon", "contrefacon", "faux avis", "avis client", "prix", "comparateur",
    "place de marché", "internet", "site web", "application", "appli",
]

RSS_SOURCES = [
    # — Autorités françaises —
    {"url": "https://www.cnil.fr/fr/rss.xml",                                                                                   "source": "CNIL"},
    {"url": "https://cyber.gouv.fr/actualites/rss/",                                                                            "source": "ANSSI"},
    {"url": "https://www.arcom.fr/rss.xml",                                                                                     "source": "ARCOM"},
    {"url": "https://www.arcep.fr/actualites/suivre-actualite-regulation-arcep/fil-dinfos/rss.xml",                             "source": "ARCEP"},
    {"url": "https://www.economie.gouv.fr/dgccrf/rss",                                                                          "source": "DGCCRF", "filter": DGCCRF_KEYWORDS},
    {"url": "https://www.conseil-constitutionnel.fr/flux/rss.xml",                                                              "source": "Conseil constitutionnel"},
    {"url": "https://www.conseil-etat.fr/rss/actualites-rss",                                                                   "source": "Conseil d'État"},
    # — Institutions européennes —
    {"url": "https://www.edpb.europa.eu/feed/news_en",                                                                          "source": "EDPB"},
    {"url": "https://www.edps.europa.eu/feed/news_en",                                                                          "source": "EDPS"},
    {"url": "https://eur-lex.europa.eu/oj/daily-view/C-series/rss.xml",                                                         "source": "EUR-Lex"},
    # — Associations & think tanks —
    {"url": "https://cedpo.eu/feed/",                                                                                            "source": "CEDPO"},
    {"url": "https://www.cigref.fr/feed",                                                                                       "source": "CIGREF"},
    # — Sources juridiques —
    {"url": "https://www.legalis.net/feed",                                                                                     "source": "Legalis"},
    {"url": "https://www.labase-lextenso.fr/rss?revue=DNU",                                                                     "source": "Lextenso"},
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
HEADERS   = {"User-Agent": "VeilleBot/1.0", "Accept": "application/xml,text/xml,*/*"}

import urllib.request

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

def categorize(title, desc):
    text = (title + " " + (desc or "")).lower()
    scores = {cat: sum(1 for kw in kws if kw in text) for cat, kws in CATEGORIES.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "RGPD"

def fetch_feed(src):
    items = []
    filter_kws = src.get("filter")
    try:
        raw = fetch(src["url"])
        d = feedparser.parse(raw)
        skipped = 0
        for entry in d.entries[:20]:
            title = clean(entry.get("title", ""))
            url   = entry.get("link", "").strip()
            date  = parse_date(entry.get("published_parsed") or entry.get("updated_parsed"))
            desc  = clean(entry.get("summary", ""))
            if filter_kws:
                text = (title + " " + desc).lower()
                if not any(kw in text for kw in filter_kws):
                    skipped += 1
                    continue
            if title and url:
                items.append({"title": title, "url": url, "date": date, "desc": desc})
        suffix = f" ({skipped} filtrés)" if skipped else ""
        print(f"  ✓ {src['source']}: {len(items)} items{suffix}")
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
