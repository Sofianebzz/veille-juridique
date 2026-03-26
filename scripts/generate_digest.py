#!/usr/bin/env python3
"""
Génération du digest hebdomadaire — Veille Droit du Numérique
Sélectionne le top 10 des articles de la semaine écoulée
et génère digest.html avec un bouton "Copier pour LinkedIn"
"""
import json, os, re
from datetime import datetime, timedelta

ROOT      = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEGAL_FILE = os.path.join(ROOT, "data", "veille.json")
TECH_FILE  = os.path.join(ROOT, "data", "tech.json")
OUT_FILE   = os.path.join(ROOT, "digest.html")

CAT_EMOJI = {
    "RGPD":          "⚖️",
    "IA":            "🤖",
    "Cybersécurité": "🔒",
    "Plateformes":   "📲",
    "PI numérique":  "©️",
    "Contrats IT":   "📝",
    "Jurisprudence": "🏛️",
    "International": "🌍",
    "IA & Modèles":  "🤖",
    "Big Tech":      "🏢",
    "Startups & VC": "🚀",
    "Open Source":   "💻",
    "Hardware":      "🖥️",
    "Cloud & Infra": "☁️",
    "Sécurité":      "🔒",
    "Numérique & Société": "🌐",
}

SOURCE_PRIORITY = [
    "CNIL", "ANSSI", "EDPB", "EDPS", "Conseil constitutionnel", "Conseil d'État",
    "ARCOM", "ARCEP", "CEDPO", "Commission UE", "EUR-Lex",
    "Legalis", "CIGREF", "Lextenso"
]

def load(path):
    return json.load(open(path, encoding="utf-8")) if os.path.exists(path) else []

def score(article, cutoff):
    """Score de pertinence : fraîcheur + source officielle + catégorie"""
    # Bonus fraîcheur
    bonus_fraicheur = 10 if article.get("date", "") >= cutoff else 0

    # Bonus source (plus la source est haute dans la liste, plus le bonus est élevé)
    bonus_source = 0
    if article.get("source") in SOURCE_PRIORITY:
        bonus_source = len(SOURCE_PRIORITY) - SOURCE_PRIORITY.index(article["source"])

    # Bonus catégorie
    cat = article.get("cat", "")
    if cat in ("RGPD", "IA", "Jurisprudence"):
        bonus_categorie = 3
    elif cat in ("Cybersécurité", "Plateformes"):
        bonus_categorie = 2
    else:
        bonus_categorie = 1

    return bonus_fraicheur + bonus_source + bonus_categorie

def select_top(articles, cutoff, n=10):
    week = [a for a in articles if a.get("date", "") >= cutoff]
    week.sort(key=lambda a: score(a, cutoff), reverse=True)
    seen_titles = set()
    result = []
    for a in week:
        key = a["title"][:60]
        if key not in seen_titles:
            seen_titles.add(key)
            result.append(a)
        if len(result) >= n:
            break
    return result

def group_by_cat(articles):
    groups = {}
    for a in articles:
        cat = a.get("cat", "Autre")
        groups.setdefault(cat, []).append(a)
    return groups

def linkedin_text(articles, week_label):
    lines = [
        f"📰 Veille Droit du Numérique — {week_label}",
        "",
        "Mon top 10 des actualités de la semaine :",
        "",
    ]
    groups = group_by_cat(articles)
    for cat, items in groups.items():
        emoji = CAT_EMOJI.get(cat, "📌")
        lines.append(f"{emoji} {cat}")
        for a in items:
            title = a["title"][:80] + ("…" if len(a["title"]) > 80 else "")
            lines.append(f"• {title}")
            lines.append(f"  {a['url']}")
        lines.append("")
    lines += [
        "#DroitDuNumérique #RGPD #IA #Cybersécurité #Veille #Juridique #DPO #DSA",
    ]
    return "\n".join(lines)

def generate_html(articles, week_label, li_text):
    groups = group_by_cat(articles)
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    cards_html = ""
    for cat, items in groups.items():
        emoji = CAT_EMOJI.get(cat, "📌")
        cards_html += f'<h2 class="cat-title">{emoji} {cat}</h2>\n<div class="cards">\n'
        for a in items:
            source = a.get("source", "")
            date   = a.get("date", "")
            desc   = a.get("desc", "")[:200]
            title  = a["title"]
            url    = a["url"]
            cards_html += f"""  <a class="card" href="{url}" target="_blank" rel="noopener">
    <div class="card-meta">{source} · {date}</div>
    <div class="card-title">{title}</div>
    {"<div class='card-desc'>" + desc + "</div>" if desc else ""}
  </a>
"""
        cards_html += "</div>\n"

    li_escaped = li_text.replace("`", "\\`").replace("\\", "\\\\").replace("${", "\\${")

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Digest — {week_label}</title>
  <style>
    :root {{
      --bg: #f7f7f5; --surface: #fff; --border: #e8e8e6;
      --accent: #2c5f8a; --text: #1a1a1a; --muted: #6b7280;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ background: var(--bg); color: var(--text); font-family: Georgia, serif;
            font-size: 16px; line-height: 1.7; padding: 2rem 1rem; }}
    .container {{ max-width: 820px; margin: 0 auto; }}
    header {{ margin-bottom: 2rem; border-bottom: 2px solid var(--accent); padding-bottom: 1rem; }}
    header h1 {{ font-size: 1.6rem; color: var(--accent); }}
    header p {{ color: var(--muted); font-size: 0.9rem; margin-top: 0.3rem; }}
    .linkedin-btn {{
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: #0077b5; color: #fff; border: none; border-radius: 6px;
      padding: 0.6rem 1.2rem; font-size: 0.9rem; cursor: pointer;
      margin: 1.5rem 0; font-family: Georgia, serif;
      transition: background 0.2s;
    }}
    .linkedin-btn:hover {{ background: #005f8f; }}
    .linkedin-btn.copied {{ background: #15803d; }}
    .cat-title {{ font-size: 1.1rem; margin: 2rem 0 0.8rem; color: var(--accent); }}
    .cards {{ display: flex; flex-direction: column; gap: 0.8rem; }}
    .card {{
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 8px; padding: 1rem 1.2rem;
      text-decoration: none; color: inherit;
      transition: border-color 0.15s, box-shadow 0.15s;
    }}
    .card:hover {{ border-color: var(--accent); box-shadow: 0 2px 8px rgba(44,95,138,.1); }}
    .card-meta {{ font-size: 0.78rem; color: var(--muted); margin-bottom: 0.3rem; }}
    .card-title {{ font-size: 0.97rem; font-weight: bold; }}
    .card-desc {{ font-size: 0.85rem; color: var(--muted); margin-top: 0.3rem; }}
    footer {{ margin-top: 3rem; font-size: 0.8rem; color: var(--muted);
              border-top: 1px solid var(--border); padding-top: 1rem; }}
    .back-link {{ display: inline-block; margin-bottom: 1rem; font-size: 0.85rem;
                  color: var(--accent); text-decoration: none; }}
    .back-link:hover {{ text-decoration: underline; }}
  </style>
</head>
<body>
<div class="container">
  <a class="back-link" href="index.html">← Retour à la veille complète</a>
  <header>
    <h1>📰 Digest — {week_label}</h1>
    <p>Top 10 des actualités en droit du numérique et tech de la semaine</p>
  </header>

  <button class="linkedin-btn" onclick="copyLinkedIn(this)">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
    Copier le post LinkedIn
  </button>

  {cards_html}

  <footer>Généré automatiquement le {now} · <a href="index.html">Veille complète</a></footer>
</div>

<script>
const LI_TEXT = `{li_escaped}`;
function copyLinkedIn(btn) {{
  navigator.clipboard.writeText(LI_TEXT).then(() => {{
    btn.textContent = "✓ Copié !";
    btn.classList.add("copied");
    setTimeout(() => {{
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> Copier le post LinkedIn`;
      btn.classList.remove("copied");
    }}, 2500);
  }});
}}
</script>
</body>
</html>
"""

def main():
    today  = datetime.now()
    cutoff = (today - timedelta(days=7)).strftime("%Y-%m-%d")
    week_start = (today - timedelta(days=today.weekday())).strftime("%d/%m/%Y")
    week_label = f"Semaine du {week_start}"

    legal   = load(LEGAL_FILE)
    tech    = load(TECH_FILE)
    all_art = legal + tech

    top = select_top(all_art, cutoff, n=10)
    if not top:
        print("  [!] Aucun article cette semaine -- digest non genere.")
        return

    li_text  = linkedin_text(top, week_label)
    html     = generate_html(top, week_label, li_text)

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"  OK digest.html genere : {len(top)} articles ({week_label})")

if __name__ == "__main__":
    main()
