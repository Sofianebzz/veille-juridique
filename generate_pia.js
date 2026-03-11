const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TableOfContents
} = require('./node_modules/docx');

const fs = require('fs');

// ── Helpers ──────────────────────────────────────────────────────────────────

const CONTENT_WIDTH = 9026; // A4 with 1-inch margins (DXA)

const border = (color = "AAAAAA") => ({ style: BorderStyle.SINGLE, size: 1, color });
const borders = (color) => ({ top: border(color), bottom: border(color), left: border(color), right: border(color) });
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: "FFFFFF" });
const noBorders = () => ({ top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() });

function cell(text, opts = {}) {
  const {
    bold = false, shade = null, colSpan, align = AlignmentType.LEFT,
    vAlign = VerticalAlign.CENTER, width, color = "000000", italic = false,
    fontSize = 20 // 10pt
  } = opts;
  return new TableCell({
    columnSpan: colSpan,
    verticalAlign: vAlign,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    borders: borders("CCCCCC"),
    shading: shade ? { fill: shade, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, bold, italic, color, size: fontSize, font: "Arial" })]
    })]
  });
}

function hCell(text, width, shade = "1F4E79") {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: borders("1F4E79"),
    shading: { fill: shade, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 20, font: "Arial" })]
    })]
  });
}

function p(text, opts = {}) {
  const { bold = false, italic = false, size = 22, color = "000000", spacing, align, indent, heading } = opts;
  return new Paragraph({
    heading,
    alignment: align,
    spacing: spacing || { before: 60, after: 60 },
    indent,
    children: [new TextRun({ text, bold, italic, size, color, font: "Arial" })]
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28, color: "1F4E79", font: "Arial" })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: "2E75B6", font: "Arial" })]
  });
}

function spacer(n = 1) {
  return Array.from({ length: n }, () => new Paragraph({
    spacing: { before: 0, after: 0 },
    children: [new TextRun({ text: "", size: 22 })]
  }));
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 20, font: "Arial" })]
  });
}

// Risk level badge colours
const riskColor = { "Faible": "70AD47", "Modéré": "F4B942", "Élevé": "C00000", "Critique": "7B2C2C" };

function riskCell(level) {
  const fill = riskColor[level] || "AAAAAA";
  return new TableCell({
    borders: borders("CCCCCC"),
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: level, bold: true, color: "FFFFFF", size: 20, font: "Arial" })]
    })]
  });
}

function completionCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: borders("CCCCCC"),
    shading: { fill: "FFF2CC", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, italic: true, color: "7F6000", size: 20, font: "Arial" })]
    })]
  });
}

// ── Document ─────────────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: "\u2022",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 600, hanging: 300 } } }
      }]
    }]
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "1F4E79" },
        paragraph: { spacing: { before: 300, after: 120 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: "2F5496" },
        paragraph: { spacing: { before: 180, after: 60 }, outlineLevel: 2 }
      },
    ]
  },
  sections: [
    // ── SECTION 1: PAGE DE GARDE ──────────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        ...spacer(4),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 120 },
          children: [new TextRun({ text: "CONFIDENTIEL", bold: true, size: 20, color: "C00000", font: "Arial" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { bottom: { style: BorderStyle.THICK, size: 12, color: "1F4E79" } },
          spacing: { before: 0, after: 240 },
          children: []
        }),
        ...spacer(1),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 240 },
          children: [new TextRun({ text: "ANALYSE D'IMPACT RELATIVE À", bold: true, size: 52, color: "1F4E79", font: "Arial" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 480 },
          children: [new TextRun({ text: "LA PROTECTION DES DONNÉES (AIPD)", bold: true, size: 52, color: "1F4E79", font: "Arial" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 120 },
          children: [new TextRun({ text: "Gestion des accès et connexions aux outils d\u2019Intelligence Artificielle", bold: true, size: 34, color: "2E75B6", font: "Arial" })]
        }),
        ...spacer(3),
        new Table({
          width: { size: 6000, type: WidthType.DXA },
          columnWidths: [2400, 3600],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders: noBorders(), margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Référence :", bold: true, size: 22, font: "Arial" })] })] }),
              new TableCell({ borders: noBorders(), margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "PIA-IA-2026-001", size: 22, font: "Arial" })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: noBorders(), margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Version :", bold: true, size: 22, font: "Arial" })] })] }),
              new TableCell({ borders: noBorders(), margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "1.0 — Draft", size: 22, font: "Arial" })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: noBorders(), margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Date :", bold: true, size: 22, font: "Arial" })] })] }),
              new TableCell({ borders: noBorders(), margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Mars 2026", size: 22, font: "Arial" })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: noBorders(), margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Auteur :", bold: true, size: 22, font: "Arial" })] })] }),
              new TableCell({ borders: noBorders(), margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "[Nom du DPO / Auteur]", italic: true, color: "7F7F7F", size: 22, font: "Arial" })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: noBorders(), margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Organisation :", bold: true, size: 22, font: "Arial" })] })] }),
              new TableCell({ borders: noBorders(), margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "[Nom de l\u2019organisation]", italic: true, color: "7F7F7F", size: 22, font: "Arial" })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: noBorders(), margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Statut :", bold: true, size: 22, font: "Arial" })] })] }),
              new TableCell({ borders: noBorders(), margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "DRAFT — En attente de validation", bold: true, color: "C00000", size: 22, font: "Arial" })] })] }),
            ]}),
          ]
        }),
        ...spacer(3),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 6, color: "1F4E79" } },
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: "Ce document est strictement confidentiel. Il ne doit pas \u00eatre diffus\u00e9 sans autorisation.", italic: true, size: 18, color: "7F7F7F", font: "Arial" })]
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ── SOMMAIRE ─────────────────────────────────────────────────────
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 200 },
          children: [new TextRun({ text: "SOMMAIRE", bold: true, size: 28, color: "1F4E79", font: "Arial" })]
        }),
        new TableOfContents("Table des matières", {
          hyperlink: true,
          headingStyleRange: "1-3"
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════════════════════════════════
        // PARTIE 1 — DESCRIPTION DU TRAITEMENT
        // ════════════════════════════════════════════════════════════════
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: "PARTIE 1 \u2014 DESCRIPTION DU TRAITEMENT", bold: true, size: 28, color: "1F4E79", font: "Arial" })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "1.1 Contexte et pr\u00e9sentation g\u00e9n\u00e9rale", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        p("L\u2019application de gestion des acc\u00e8s aux outils d\u2019Intelligence Artificielle est un syst\u00e8me centralis\u00e9 permettant de contr\u00f4ler et s\u00e9curiser les connexions des collaborateurs (internes et prestataires) aux plateformes et services d\u2019IA utilis\u00e9s dans le cadre de l\u2019activit\u00e9 professionnelle de l\u2019organisation.", { size: 22 }),
        ...spacer(1),
        p("L\u2019outil poursuit les objectifs suivants :", { size: 22 }),
        bullet("S\u00e9curiser et contr\u00f4ler les acc\u00e8s aux services d\u2019IA (authentification, habilitations),"),
        bullet("Tracer les connexions \u00e0 des fins de s\u00e9curit\u00e9 et de conformit\u00e9,"),
        bullet("G\u00e9rer le cycle de vie des droits d\u2019acc\u00e8s (attribution, modification, r\u00e9vocation),"),
        bullet("D\u00e9tecter les tentatives d\u2019acc\u00e8s non autoris\u00e9s ou les comportements anormaux."),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "1.2 Finalit\u00e9s du traitement", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [400, 4000, 4626],
          rows: [
            new TableRow({ children: [hCell("#", 400), hCell("Finalit\u00e9", 4000), hCell("D\u00e9tails", 4626)] }),
            new TableRow({ children: [
              cell("1", { shade: "DEEAF1", align: AlignmentType.CENTER, width: 400 }),
              cell("Contr\u00f4le et authentification des acc\u00e8s", { width: 4000 }),
              cell("V\u00e9rification de l\u2019identit\u00e9 des utilisateurs avant acc\u00e8s aux outils IA", { width: 4626 }),
            ]}),
            new TableRow({ children: [
              cell("2", { shade: "DEEAF1", align: AlignmentType.CENTER, width: 400 }),
              cell("Gestion des droits et habilitations", { width: 4000 }),
              cell("Attribution, modification et r\u00e9vocation des acc\u00e8s selon le profil", { width: 4626 }),
            ]}),
            new TableRow({ children: [
              cell("3", { shade: "DEEAF1", align: AlignmentType.CENTER, width: 400 }),
              cell("Tra\u00e7abilit\u00e9 des connexions", { width: 4000 }),
              cell("Conservation des logs de connexion \u00e0 des fins de s\u00e9curit\u00e9 informatique", { width: 4626 }),
            ]}),
            new TableRow({ children: [
              cell("4", { shade: "DEEAF1", align: AlignmentType.CENTER, width: 400 }),
              cell("D\u00e9tection des anomalies", { width: 4000 }),
              cell("Surveillance des acc\u00e8s suspects ou non autoris\u00e9s", { width: 4626 }),
            ]}),
          ]
        }),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "1.3 Donn\u00e9es personnelles trait\u00e9es", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [1800, 2800, 2400, 2026],
          rows: [
            new TableRow({ children: [
              hCell("Cat\u00e9gorie", 1800), hCell("Donn\u00e9es concern\u00e9es", 2800),
              hCell("Finalit\u00e9 associ\u00e9e", 2400), hCell("Dur\u00e9e de conservation", 2026)
            ]}),
            new TableRow({ children: [
              cell("Identit\u00e9", { shade: "DEEAF1", bold: true, width: 1800 }),
              cell("Nom, pr\u00e9nom, adresse email professionnelle", { width: 2800 }),
              cell("Authentification et gestion des acc\u00e8s", { width: 2400 }),
              cell("Dur\u00e9e de la relation active + 5 ans (archivage)", { width: 2026 }),
            ]}),
            new TableRow({ children: [
              cell("Connexion / Logs", { shade: "DEEAF1", bold: true, width: 1800 }),
              cell("Logs de connexion, horodatages, adresse IP interne, identifiant de session", { width: 2800 }),
              cell("Tra\u00e7abilit\u00e9 s\u00e9curit\u00e9 et d\u00e9tection des anomalies", { width: 2400 }),
              cell("1 an en base active, 5 ans en archivage", { width: 2026 }),
            ]}),
          ]
        }),
        ...spacer(1),
        p("Note : Aucune donn\u00e9e sensible au sens de l\u2019article 9 du RGPD n\u2019est trait\u00e9e dans le cadre de ce traitement.", { italic: true, size: 20, color: "595959" }),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "1.4 Personnes concern\u00e9es", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        bullet("Salari\u00e9s et agents internes de l\u2019organisation ayant acc\u00e8s aux outils d\u2019IA,"),
        bullet("Prestataires et sous-traitants externes auxquels un acc\u00e8s aux outils d\u2019IA est accord\u00e9 dans le cadre de leur mission."),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "1.5 Destinataires et sous-traitants", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [2200, 1400, 1400, 2000, 2026],
          rows: [
            new TableRow({ children: [
              hCell("Destinataire / Sous-traitant", 2200), hCell("R\u00f4le", 1400),
              hCell("Localisation", 1400), hCell("Base du transfert", 2000), hCell("DPA", 2026)
            ]}),
            new TableRow({ children: [
              cell("DSI / \u00c9quipe s\u00e9curit\u00e9 interne", { width: 2200 }),
              cell("Destinataire interne", { width: 1400 }),
              cell("France", { width: 1400 }),
              cell("N/A (m\u00eame entit\u00e9)", { width: 2000 }),
              cell("N/A", { align: AlignmentType.CENTER, width: 2026 }),
            ]}),
            new TableRow({ children: [
              cell("Fournisseur(s) IA\n(ex. Anthropic, OpenAI)", { width: 2200 }),
              cell("Sous-traitant (art. 28 RGPD)", { width: 1400 }),
              cell("\u00c9tats-Unis", { width: 1400 }),
              cell("Clauses Contractuelles Types (SCCs 2021 — module C2P)", { width: 2000 }),
              completionCell("\u00c0 signer", 2026),
            ]}),
            new TableRow({ children: [
              cell("H\u00e9bergeur cloud", { width: 2200 }),
              cell("Sous-traitant", { width: 1400 }),
              completionCell("\u00c0 pr\u00e9ciser", 1400),
              cell("SCCs ou d\u00e9cision d\u2019ad\u00e9quation", { width: 2000 }),
              completionCell("\u00c0 v\u00e9rifier", 2026),
            ]}),
          ]
        }),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "1.6 Transferts hors Union Europ\u00e9enne", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        p("Des transferts de donn\u00e9es hors de l\u2019Union Europ\u00e9enne sont anticip\u00e9s, notamment vers les \u00c9tats-Unis, du fait du recours \u00e0 des fournisseurs de solutions d\u2019IA am\u00e9ricains. Les mesures suivantes doivent \u00eatre mises en place :", { size: 22 }),
        ...spacer(1),
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [3000, 6026],
          rows: [
            new TableRow({ children: [hCell("M\u00e9canisme", 3000), hCell("D\u00e9tails", 6026)] }),
            new TableRow({ children: [
              cell("Clauses Contractuelles Types", { shade: "DEEAF1", bold: true, width: 3000 }),
              cell("SCCs version juin 2021 (JOUE 2021/914), module Controller-to-Processor (C2P)", { width: 6026 }),
            ]}),
            new TableRow({ children: [
              cell("Transfer Impact Assessment (TIA)", { shade: "DEEAF1", bold: true, width: 3000 }),
              completionCell("\u00c0 r\u00e9aliser : \u00e9valuation des conditions l\u00e9gales du pays destinataire (USA \u2014 surveillance \u00e9tatique, CLOUD Act)", 6026),
            ]}),
            new TableRow({ children: [
              cell("Mesures compl\u00e9mentaires \u00e9ventuelles", { shade: "DEEAF1", bold: true, width: 3000 }),
              completionCell("\u00c0 \u00e9valuer selon les r\u00e9sultats du TIA (pseudonymisation, chiffrement bout-en-bout, localisation des donn\u00e9es)", 6026),
            ]}),
          ]
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════════════════════════════════
        // PARTIE 2 — NÉCESSITÉ ET PROPORTIONNALITÉ
        // ════════════════════════════════════════════════════════════════
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: "PARTIE 2 \u2014 APR\u00c9CIATION DE LA N\u00c9CESSIT\u00c9 ET DE LA PROPORTIONNALIT\u00c9", bold: true, size: 28, color: "1F4E79", font: "Arial" })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "2.1 Pertinence et ad\u00e9quation des donn\u00e9es (minimisation)", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        bullet("Seules les donn\u00e9es strictement n\u00e9cessaires \u00e0 l\u2019authentification et \u00e0 la tra\u00e7abilit\u00e9 sont collect\u00e9es."),
        bullet("L\u2019email professionnel est pr\u00e9f\u00e9r\u00e9 \u00e0 l\u2019email personnel pour limiter l\u2019exposition des donn\u00e9es priv\u00e9es."),
        bullet("Les logs de connexion (IP, horodatage, session ID) sont n\u00e9cessaires pour les finalit\u00e9s de s\u00e9curit\u00e9 et de d\u00e9tection des anomalies."),
        bullet("Aucune donn\u00e9e de contenu (prompts envoy\u00e9s aux outils IA) n\u2019est collect\u00e9e dans ce traitement."),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "2.2 Limitation des finalit\u00e9s", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        bullet("Les donn\u00e9es collect\u00e9es sont utilis\u00e9es exclusivement pour la gestion des acc\u00e8s aux outils d\u2019IA."),
        bullet("Elles ne sont pas exploit\u00e9es \u00e0 des fins RH, commerciales ou de profiling comportemental."),
        bullet("Toute utilisation secondaire n\u00e9cessitera une nouvelle analyse de compatibilit\u00e9 des finalit\u00e9s et, le cas \u00e9ch\u00e9ant, une base l\u00e9gale distincte."),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "2.3 Dur\u00e9es de conservation justifi\u00e9es", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [2500, 2500, 4026],
          rows: [
            new TableRow({ children: [hCell("Donn\u00e9e", 2500), hCell("Conservation active", 2500), hCell("Archivage / Justification", 4026)] }),
            new TableRow({ children: [
              cell("Donn\u00e9es d\u2019identit\u00e9", { shade: "DEEAF1", width: 2500 }),
              cell("Dur\u00e9e de la relation professionnelle", { width: 2500 }),
              cell("5 ans apr\u00e8s fin de relation — pr\u00e9scription civile (art. L110-4 C.com.)", { width: 4026 }),
            ]}),
            new TableRow({ children: [
              cell("Logs de connexion", { shade: "DEEAF1", width: 2500 }),
              cell("1 an glissant", { width: 2500 }),
              cell("5 ans en archivage — recommandation CNIL (d\u00e9lib\u00e9ration n\u00b02006-066)", { width: 4026 }),
            ]}),
          ]
        }),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "2.4 Information des personnes concern\u00e9es", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        bullet("Information fournie lors de l\u2019onboarding (remise de la charte informatique + mention RGPD)."),
        bullet("Mention dans la politique de confidentialit\u00e9 interne, accessible \u00e0 tout moment."),
        bullet("Mise \u00e0 jour du registre des activit\u00e9s de traitement (Article 30 RGPD) par le DPO."),
        bullet("Mise \u00e0 jour de l\u2019information en cas de changement significatif du traitement."),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "2.5 Exercice des droits des personnes", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [2500, 2500, 4026],
          rows: [
            new TableRow({ children: [hCell("Droit", 2500), hCell("Exercice possible ?", 2500), hCell("Commentaires", 4026)] }),
            new TableRow({ children: [
              cell("Acc\u00e8s (art. 15)", { shade: "DEEAF1", width: 2500 }),
              cell("Oui", { shade: "E2EFDA", align: AlignmentType.CENTER, width: 2500 }),
              cell("Via le DPO \u2014 r\u00e9ponse sous 30 jours", { width: 4026 }),
            ]}),
            new TableRow({ children: [
              cell("Rectification (art. 16)", { shade: "DEEAF1", width: 2500 }),
              cell("Oui", { shade: "E2EFDA", align: AlignmentType.CENTER, width: 2500 }),
              cell("Correction des donn\u00e9es d\u2019identit\u00e9 inexactes", { width: 4026 }),
            ]}),
            new TableRow({ children: [
              cell("Effacement (art. 17)", { shade: "DEEAF1", width: 2500 }),
              cell("Partiel", { shade: "FFF2CC", align: AlignmentType.CENTER, width: 2500 }),
              cell("Limit\u00e9 par les obligations de s\u00e9curit\u00e9 et les dur\u00e9es l\u00e9gales de conservation des logs", { width: 4026 }),
            ]}),
            new TableRow({ children: [
              cell("Portabilit\u00e9 (art. 20)", { shade: "DEEAF1", width: 2500 }),
              cell("Non applicable", { shade: "FCE4D6", align: AlignmentType.CENTER, width: 2500 }),
              cell("Base l\u00e9gale = int\u00e9r\u00eat l\u00e9gitime (non concern\u00e9 par la portabilit\u00e9)", { width: 4026 }),
            ]}),
            new TableRow({ children: [
              cell("Opposition (art. 21)", { shade: "DEEAF1", width: 2500 }),
              cell("Examen cas par cas", { shade: "FFF2CC", align: AlignmentType.CENTER, width: 2500 }),
              cell("Examen au cas par cas selon les motifs l\u00e9gitimes invoqu\u00e9s par la personne", { width: 4026 }),
            ]}),
          ]
        }),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "2.6 Sous-traitance et contr\u00f4le de la cha\u00eene", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        bullet("Un contrat de traitement des donn\u00e9es (DPA) conforme \u00e0 l\u2019article 28 du RGPD doit \u00eatre sign\u00e9 avec chaque sous-traitant."),
        bullet("Les sous-traitants ne peuvent faire appel \u00e0 un sous-traitant ult\u00e9rieur sans autorisation pr\u00e9alable du responsable du traitement."),
        bullet("Un audit p\u00e9riodique des sous-traitants est pr\u00e9vu (rapport SOC 2 Type II ou audit sur site)."),
        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════════════════════════════════
        // PARTIE 3 — ANALYSE DES RISQUES
        // ════════════════════════════════════════════════════════════════
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: "PARTIE 3 \u2014 ANALYSE DES RISQUES SUR LA VIE PRIV\u00c9E", bold: true, size: 28, color: "1F4E79", font: "Arial" })]
        }),
        p("L\u2019analyse des risques est conduite selon la m\u00e9thodologie CNIL. Chaque risque est \u00e9valu\u00e9 selon deux axes : l\u2019impact sur les droits et libert\u00e9s des personnes concern\u00e9es, et la vraisemblance de sa survenance.", { size: 22 }),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "3.1 Tableau d\u2019analyse des risques", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [1600, 1500, 1200, 1200, 1200, 2326],
          rows: [
            new TableRow({ children: [
              hCell("Risque", 1600), hCell("Source de menace", 1500),
              hCell("Impact", 1200), hCell("Vraisemblance", 1200),
              hCell("Niveau", 1200), hCell("Mesures principales", 2326)
            ]}),
            new TableRow({ children: [
              cell("R1 \u2014 Acc\u00e8s non autoris\u00e9 aux donn\u00e9es (confidentialit\u00e9)", { width: 1600 }),
              cell("Attaque externe, insider malveillant", { width: 1500 }),
              new TableCell({ width: { size: 1200, type: WidthType.DXA }, borders: borders("CCCCCC"), margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Fort", bold: true, color: "C00000", size: 20, font: "Arial" })] })] }),
              new TableCell({ width: { size: 1200, type: WidthType.DXA }, borders: borders("CCCCCC"), margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mod\u00e9r\u00e9e", bold: true, color: "F4B942", size: 20, font: "Arial" })] })] }),
              riskCell("\u00c9lev\u00e9"),
              cell("Chiffrement, RBAC, MFA, journalisation admins", { width: 2326 }),
            ]}),
            new TableRow({ children: [
              cell("R2 \u2014 Divulgation \u00e0 un tiers non autoris\u00e9 (confidentialit\u00e9)", { width: 1600 }),
              cell("Erreur humaine, mauvaise configuration", { width: 1500 }),
              new TableCell({ width: { size: 1200, type: WidthType.DXA }, borders: borders("CCCCCC"), margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mod\u00e9r\u00e9", bold: true, color: "F4B942", size: 20, font: "Arial" })] })] }),
              new TableCell({ width: { size: 1200, type: WidthType.DXA }, borders: borders("CCCCCC"), margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Faible", bold: true, color: "70AD47", size: 20, font: "Arial" })] })] }),
              riskCell("Mod\u00e9r\u00e9"),
              cell("DPA avec sous-traitants, audits, minimisation des acc\u00e8s", { width: 2326 }),
            ]}),
            new TableRow({ children: [
              cell("R3 \u2014 Alt\u00e9ration ou perte des donn\u00e9es (int\u00e9grit\u00e9 / disponibilit\u00e9)", { width: 1600 }),
              cell("Cyberattaque (ransomware), d\u00e9faillance technique", { width: 1500 }),
              new TableCell({ width: { size: 1200, type: WidthType.DXA }, borders: borders("CCCCCC"), margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mod\u00e9r\u00e9", bold: true, color: "F4B942", size: 20, font: "Arial" })] })] }),
              new TableCell({ width: { size: 1200, type: WidthType.DXA }, borders: borders("CCCCCC"), margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Faible", bold: true, color: "70AD47", size: 20, font: "Arial" })] })] }),
              riskCell("Mod\u00e9r\u00e9"),
              cell("Sauvegardes r\u00e9guli\u00e8res, PRA/PCA, int\u00e9grit\u00e9 des logs garantie", { width: 2326 }),
            ]}),
            new TableRow({ children: [
              cell("R4 \u2014 Transfert vers pays tiers sans garanties (conformit\u00e9)", { width: 1600 }),
              cell("Fournisseur IA bas\u00e9 hors UE", { width: 1500 }),
              new TableCell({ width: { size: 1200, type: WidthType.DXA }, borders: borders("CCCCCC"), margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Fort", bold: true, color: "C00000", size: 20, font: "Arial" })] })] }),
              new TableCell({ width: { size: 1200, type: WidthType.DXA }, borders: borders("CCCCCC"), margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mod\u00e9r\u00e9e", bold: true, color: "F4B942", size: 20, font: "Arial" })] })] }),
              riskCell("\u00c9lev\u00e9"),
              cell("Signature SCCs 2021, TIA, \u00e9valuation des garanties compl\u00e9mentaires", { width: 2326 }),
            ]}),
            new TableRow({ children: [
              cell("R5 \u2014 Surveillance excessive des utilisateurs (proportionnalit\u00e9)", { width: 1600 }),
              cell("Utilisation d\u00e9tourn\u00e9e des logs de connexion", { width: 1500 }),
              new TableCell({ width: { size: 1200, type: WidthType.DXA }, borders: borders("CCCCCC"), margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Fort", bold: true, color: "C00000", size: 20, font: "Arial" })] })] }),
              new TableCell({ width: { size: 1200, type: WidthType.DXA }, borders: borders("CCCCCC"), margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Faible", bold: true, color: "70AD47", size: 20, font: "Arial" })] })] }),
              riskCell("Mod\u00e9r\u00e9"),
              cell("Limitation stricte des finalit\u00e9s, acc\u00e8s aux logs restreint, proc\u00e9dure d\u2019acc\u00e8s d\u00e9finie", { width: 2326 }),
            ]}),
          ]
        }),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "3.2 Matrice des risques (Impact \u00d7 Vraisemblance)", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        p("Lecture : chaque risque est positionn\u00e9 dans la matrice selon son niveau d\u2019impact (vertical) et sa vraisemblance (horizontal) avant mesures.", { italic: true, size: 20 }),
        ...spacer(1),

        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [1800, 1850, 1850, 1850, 1676],
          rows: [
            // Header row
            new TableRow({ children: [
              new TableCell({ borders: noBorders(), margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Impact \u2193 / Vraisemblance \u2192", bold: true, size: 18, font: "Arial", color: "595959" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "DEEAF1", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Faible", bold: true, size: 20, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "DEEAF1", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mod\u00e9r\u00e9e", bold: true, size: 20, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "DEEAF1", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u00c9lev\u00e9e", bold: true, size: 20, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "DEEAF1", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tr\u00e8s \u00e9lev\u00e9e", bold: true, size: 20, font: "Arial" })] })] }),
            ]}),
            // Row: Fort
            new TableRow({ children: [
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "DEEAF1", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Fort", bold: true, size: 20, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "FFF2CC", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mod\u00e9r\u00e9\nR5", size: 20, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "FCE4D6", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u00c9lev\u00e9\nR1, R4", bold: true, size: 20, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "C00000", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Critique", bold: true, color: "FFFFFF", size: 20, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "7B2C2C", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Critique", bold: true, color: "FFFFFF", size: 20, font: "Arial" })] })] }),
            ]}),
            // Row: Modéré
            new TableRow({ children: [
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "DEEAF1", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mod\u00e9r\u00e9", bold: true, size: 20, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "E2EFDA", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Faible\nR2, R3", size: 20, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "FFF2CC", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mod\u00e9r\u00e9", size: 20, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "FCE4D6", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u00c9lev\u00e9", bold: true, size: 20, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "C00000", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Critique", bold: true, color: "FFFFFF", size: 20, font: "Arial" })] })] }),
            ]}),
            // Row: Faible
            new TableRow({ children: [
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "DEEAF1", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Faible", bold: true, size: 20, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "E2EFDA", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Faible", size: 20, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "E2EFDA", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Faible", size: 20, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "FFF2CC", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mod\u00e9r\u00e9", size: 20, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "FCE4D6", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u00c9lev\u00e9", bold: true, size: 20, font: "Arial" })] })] }),
            ]}),
          ]
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════════════════════════════════
        // PARTIE 4 — MESURES
        // ════════════════════════════════════════════════════════════════
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: "PARTIE 4 \u2014 MESURES POUR TRAITER LES RISQUES", bold: true, size: 28, color: "1F4E79", font: "Arial" })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "4.1 Mesures techniques", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [3500, 5526],
          rows: [
            new TableRow({ children: [hCell("Mesure", 3500), hCell("Description", 5526)] }),
            new TableRow({ children: [
              cell("Authentification forte (MFA)", { shade: "DEEAF1", bold: true, width: 3500 }),
              cell("Obligation du double facteur pour tous les acc\u00e8s aux outils IA", { width: 5526 }),
            ]}),
            new TableRow({ children: [
              cell("Chiffrement en transit", { shade: "DEEAF1", bold: true, width: 3500 }),
              cell("TLS 1.2 minimum pour toutes les communications avec les fournisseurs d\u2019IA", { width: 5526 }),
            ]}),
            new TableRow({ children: [
              cell("Chiffrement au repos", { shade: "DEEAF1", bold: true, width: 3500 }),
              cell("Chiffrement des logs et donn\u00e9es stock\u00e9es (AES-256 ou \u00e9quivalent)", { width: 5526 }),
            ]}),
            new TableRow({ children: [
              cell("Contr\u00f4le d\u2019acc\u00e8s (RBAC)", { shade: "DEEAF1", bold: true, width: 3500 }),
              cell("Attribution des droits selon le r\u00f4le et le besoin r\u00e9el ; principe du moindre privil\u00e8ge", { width: 5526 }),
            ]}),
            new TableRow({ children: [
              cell("Journalisation des acc\u00e8s privil\u00e9gi\u00e9s", { shade: "DEEAF1", bold: true, width: 3500 }),
              cell("Monitoring des actions des administrateurs de l\u2019application", { width: 5526 }),
            ]}),
            new TableRow({ children: [
              cell("Politique de mots de passe", { shade: "DEEAF1", bold: true, width: 3500 }),
              cell("Longueur minimale 12 caract\u00e8res, rotation p\u00e9riodique, interdiction des mots de passe r\u00e9utilis\u00e9s", { width: 5526 }),
            ]}),
          ]
        }),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "4.2 Mesures organisationnelles", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        bullet("D\u00e9signation d\u2019un r\u00e9f\u00e9rent s\u00e9curit\u00e9 et d\u2019un DPO responsables du suivi du traitement."),
        bullet("Charte informatique opposable aux utilisateurs, sign\u00e9e lors de l\u2019onboarding."),
        bullet("Formation sp\u00e9cifique des administrateurs de l\u2019application (RGPD, gestion des acc\u00e8s)."),
        bullet("Proc\u00e9dure de gestion des incidents de s\u00e9curit\u00e9 (notification CNIL sous 72h, art. 33 RGPD)."),
        bullet("Revue p\u00e9riodique des droits d\u2019acc\u00e8s (tous les 6 mois minimum) avec purge des comptes inactifs."),
        bullet("Plan de r\u00e9ponse aux violations de donn\u00e9es documentant les \u00e9tapes de notification r\u00e9glementaire."),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "4.3 Mesures contractuelles", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        bullet("DPA (Data Processing Agreement) conforme art. 28 RGPD sign\u00e9 avec chaque sous-traitant (fournisseur IA, h\u00e9bergeur)."),
        bullet("SCCs version juin 2021 (module C2P) int\u00e9gr\u00e9es dans les contrats avec les fournisseurs hors UE."),
        bullet("Clauses d\u2019audit (droit d\u2019audit sur demande ou rapport SOC 2 Type II) incluses dans les DPA."),
        bullet("Clause de notification de violation de donn\u00e9es sous 24\u201348h dans les DPA sous-traitants (pour respecter le d\u00e9lai CNIL de 72h)."),
        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════════════════════════════════
        // PARTIE 5 — CONCLUSION ET DÉCISION
        // ════════════════════════════════════════════════════════════════
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: "PARTIE 5 \u2014 CONCLUSION ET D\u00c9CISION", bold: true, size: 28, color: "1F4E79", font: "Arial" })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "5.1 Synth\u00e8se des risques r\u00e9siduels", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [1600, 1500, 1600, 4326],
          rows: [
            new TableRow({ children: [
              hCell("Risque", 1600), hCell("Niveau initial", 1500),
              hCell("Niveau r\u00e9siduel", 1600), hCell("Mesures appliqu\u00e9es", 4326)
            ]}),
            new TableRow({ children: [
              cell("R1 \u2014 Acc\u00e8s non autoris\u00e9", { width: 1600 }),
              riskCell("\u00c9lev\u00e9"),
              riskCell("Mod\u00e9r\u00e9"),
              cell("MFA, RBAC, chiffrement, monitoring des admins", { width: 4326 }),
            ]}),
            new TableRow({ children: [
              cell("R2 \u2014 Divulgation tiers", { width: 1600 }),
              riskCell("Mod\u00e9r\u00e9"),
              riskCell("Faible"),
              cell("DPA, audits, minimisation des acc\u00e8s", { width: 4326 }),
            ]}),
            new TableRow({ children: [
              cell("R3 \u2014 Alt\u00e9ration / perte", { width: 1600 }),
              riskCell("Mod\u00e9r\u00e9"),
              riskCell("Faible"),
              cell("Sauvegardes, PRA/PCA, int\u00e9grit\u00e9 logs", { width: 4326 }),
            ]}),
            new TableRow({ children: [
              cell("R4 \u2014 Transfert hors UE", { width: 1600 }),
              riskCell("\u00c9lev\u00e9"),
              riskCell("Mod\u00e9r\u00e9"),
              cell("SCCs 2021, TIA \u00e0 finaliser, DPA \u00e0 signer", { width: 4326 }),
            ]}),
            new TableRow({ children: [
              cell("R5 \u2014 Surveillance excessive", { width: 1600 }),
              riskCell("Mod\u00e9r\u00e9"),
              riskCell("Faible"),
              cell("Limitation des finalit\u00e9s, acc\u00e8s logs restreint, proc\u00e9dure", { width: 4326 }),
            ]}),
          ]
        }),
        ...spacer(1),
        new Paragraph({
          spacing: { before: 80, after: 80 },
          children: [
            new TextRun({ text: "Niveau global de risque r\u00e9siduel : ", bold: true, size: 22, font: "Arial" }),
            new TextRun({ text: "MOD\u00c9R\u00c9", bold: true, size: 22, color: "F4B942", font: "Arial" }),
            new TextRun({ text: " \u2014 avec r\u00e9serve sur les transferts hors UE (R4, subordonn\u00e9 \u00e0 la signature des SCCs et \u00e0 la r\u00e9alisation du TIA).", size: 22, font: "Arial" }),
          ]
        }),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "5.2 Avis du D\u00e9l\u00e9gu\u00e9 \u00e0 la Protection des Donn\u00e9es (DPO)", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [CONTENT_WIDTH],
          rows: [
            new TableRow({ children: [
              new TableCell({
                borders: borders("2E75B6"),
                shading: { fill: "EBF3FB", type: ShadingType.CLEAR },
                margins: { top: 200, bottom: 200, left: 200, right: 200 },
                children: [
                  new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "Avis du DPO :", bold: true, size: 22, font: "Arial" })] }),
                  new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "[\u00c0 compl\u00e9ter par le DPO]", italic: true, color: "7F6000", size: 22, font: "Arial" })] }),
                  ...spacer(2),
                  new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "Nom du DPO : ......................................................................", size: 22, font: "Arial" })] }),
                  new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "Date : .....................................", size: 22, font: "Arial" })] }),
                ]
              })
            ]})
          ]
        }),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "5.3 D\u00e9cision du Responsable du traitement", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [800, 8226],
          rows: [
            new TableRow({ children: [hCell("", 800, "1F4E79"), hCell("Option de d\u00e9cision", 8226, "1F4E79")] }),
            new TableRow({ children: [
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "E2EFDA", type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 200, right: 200 }, width: { size: 800, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u2610", size: 28, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), margins: { top: 100, bottom: 100, left: 200, right: 200 }, width: { size: 8226, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Option 1 \u2014 Traitement autoris\u00e9 ", bold: true, size: 22, font: "Arial" }), new TextRun({ text: "(risques r\u00e9siduels consid\u00e9r\u00e9s comme acceptables sans mesures compl\u00e9mentaires)", size: 22, font: "Arial" })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "FFF2CC", type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 200, right: 200 }, width: { size: 800, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u2611", bold: true, size: 28, color: "70AD47", font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), shading: { fill: "FFF2CC", type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 200, right: 200 }, width: { size: 8226, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Option 2 \u2014 Traitement autoris\u00e9 sous r\u00e9serve ", bold: true, size: 22, color: "7F6000", font: "Arial" }), new TextRun({ text: "(mesures compl\u00e9mentaires requises — voir plan d\u2019action \u00a75.4)", size: 22, color: "7F6000", font: "Arial" })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: borders("CCCCCC"), margins: { top: 100, bottom: 100, left: 200, right: 200 }, width: { size: 800, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u2610", size: 28, font: "Arial" })] })] }),
              new TableCell({ borders: borders("CCCCCC"), margins: { top: 100, bottom: 100, left: 200, right: 200 }, width: { size: 8226, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Option 3 \u2014 Consultation pr\u00e9alable de la CNIL requise ", bold: true, size: 22, font: "Arial" }), new TextRun({ text: "(risque r\u00e9siduel \u00e9lev\u00e9 ne pouvant \u00eatre trait\u00e9 en interne)", size: 22, font: "Arial" })] })] }),
            ]}),
          ]
        }),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "5.4 Plan d\u2019action", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [3200, 1800, 1800, 2226],
          rows: [
            new TableRow({ children: [
              hCell("Action", 3200), hCell("Responsable", 1800),
              hCell("\u00c9ch\u00e9ance", 1800), hCell("Statut", 2226)
            ]}),
            new TableRow({ children: [
              cell("Signer le DPA avec le(s) fournisseur(s) IA", { width: 3200 }),
              cell("DPO / Juridique", { width: 1800 }),
              completionCell("[\u00c0 d\u00e9finir]", 1800),
              new TableCell({ width: { size: 2226, type: WidthType.DXA }, borders: borders("CCCCCC"), shading: { fill: "FFF2CC", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "En cours", bold: true, color: "7F6000", size: 20, font: "Arial" })] })] }),
            ]}),
            new TableRow({ children: [
              cell("R\u00e9aliser le Transfer Impact Assessment (TIA) pour les USA", { width: 3200 }),
              cell("DPO", { width: 1800 }),
              completionCell("[\u00c0 d\u00e9finir]", 1800),
              new TableCell({ width: { size: 2226, type: WidthType.DXA }, borders: borders("CCCCCC"), shading: { fill: "FCE4D6", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u00c0 faire", bold: true, color: "C00000", size: 20, font: "Arial" })] })] }),
            ]}),
            new TableRow({ children: [
              cell("Mettre \u00e0 jour la politique de confidentialit\u00e9 interne", { width: 3200 }),
              cell("DPO / Communication", { width: 1800 }),
              completionCell("[\u00c0 d\u00e9finir]", 1800),
              new TableCell({ width: { size: 2226, type: WidthType.DXA }, borders: borders("CCCCCC"), shading: { fill: "FCE4D6", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u00c0 faire", bold: true, color: "C00000", size: 20, font: "Arial" })] })] }),
            ]}),
            new TableRow({ children: [
              cell("Mettre en place le MFA sur l\u2019application", { width: 3200 }),
              cell("DSI", { width: 1800 }),
              completionCell("[\u00c0 d\u00e9finir]", 1800),
              new TableCell({ width: { size: 2226, type: WidthType.DXA }, borders: borders("CCCCCC"), shading: { fill: "FCE4D6", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u00c0 faire", bold: true, color: "C00000", size: 20, font: "Arial" })] })] }),
            ]}),
            new TableRow({ children: [
              cell("Former les administrateurs de l\u2019application (RGPD + s\u00e9curit\u00e9)", { width: 3200 }),
              cell("RH / DSI", { width: 1800 }),
              completionCell("[\u00c0 d\u00e9finir]", 1800),
              new TableCell({ width: { size: 2226, type: WidthType.DXA }, borders: borders("CCCCCC"), shading: { fill: "FCE4D6", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u00c0 faire", bold: true, color: "C00000", size: 20, font: "Arial" })] })] }),
            ]}),
            new TableRow({ children: [
              cell("Proc\u00e9der \u00e0 la premi\u00e8re revue des droits d\u2019acc\u00e8s (6 mois)", { width: 3200 }),
              cell("DSI / DPO", { width: 1800 }),
              completionCell("[\u00c0 d\u00e9finir]", 1800),
              new TableCell({ width: { size: 2226, type: WidthType.DXA }, borders: borders("CCCCCC"), shading: { fill: "FCE4D6", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u00c0 planifier", bold: true, color: "C00000", size: 20, font: "Arial" })] })] }),
            ]}),
          ]
        }),
        ...spacer(1),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "5.5 Validation et signatures", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [2000, 2500, 2000, 2526],
          rows: [
            new TableRow({ children: [
              hCell("R\u00f4le", 2000), hCell("Nom", 2500),
              hCell("Date", 2000), hCell("Signature", 2526)
            ]}),
            new TableRow({ children: [
              cell("Auteur du PIA", { shade: "DEEAF1", bold: true, width: 2000 }),
              completionCell("[\u00c0 compl\u00e9ter]", 2500),
              completionCell("[\u00c0 compl\u00e9ter]", 2000),
              completionCell("", 2526),
            ]}),
            new TableRow({ children: [
              cell("D\u00e9l\u00e9gu\u00e9 \u00e0 la Protection des Donn\u00e9es (DPO)", { shade: "DEEAF1", bold: true, width: 2000 }),
              completionCell("[\u00c0 compl\u00e9ter]", 2500),
              completionCell("[\u00c0 compl\u00e9ter]", 2000),
              completionCell("", 2526),
            ]}),
            new TableRow({ children: [
              cell("Responsable du traitement", { shade: "DEEAF1", bold: true, width: 2000 }),
              completionCell("[\u00c0 compl\u00e9ter]", 2500),
              completionCell("[\u00c0 compl\u00e9ter]", 2000),
              completionCell("", 2526),
            ]}),
          ]
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════════════════════════════════
        // ANNEXES
        // ════════════════════════════════════════════════════════════════
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: "ANNEXES", bold: true, size: 28, color: "1F4E79", font: "Arial" })]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "Annexe A \u2014 Extrait du Registre des activit\u00e9s de traitement (Art. 30 RGPD)", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [2500, 6526],
          rows: [
            new TableRow({ children: [hCell("Champ", 2500), hCell("Valeur", 6526)] }),
            new TableRow({ children: [cell("Nom du traitement", { shade: "DEEAF1", bold: true, width: 2500 }), cell("Gestion des acc\u00e8s et connexions aux outils d\u2019IA", { width: 6526 })] }),
            new TableRow({ children: [cell("R\u00e9f\u00e9rence registre", { shade: "DEEAF1", bold: true, width: 2500 }), completionCell("[\u00c0 compl\u00e9ter]", 6526)] }),
            new TableRow({ children: [cell("Responsable du traitement", { shade: "DEEAF1", bold: true, width: 2500 }), completionCell("[Nom de l\u2019organisation]", 6526)] }),
            new TableRow({ children: [cell("DPO", { shade: "DEEAF1", bold: true, width: 2500 }), completionCell("[\u00c0 compl\u00e9ter]", 6526)] }),
            new TableRow({ children: [cell("Base l\u00e9gale", { shade: "DEEAF1", bold: true, width: 2500 }), cell("Int\u00e9r\u00eat l\u00e9gitime \u2014 Article 6(1)(f) RGPD", { width: 6526 })] }),
            new TableRow({ children: [cell("Cat\u00e9gories de donn\u00e9es", { shade: "DEEAF1", bold: true, width: 2500 }), cell("Identit\u00e9 (nom, pr\u00e9nom, email), logs de connexion", { width: 6526 })] }),
            new TableRow({ children: [cell("Personnes concern\u00e9es", { shade: "DEEAF1", bold: true, width: 2500 }), cell("Salari\u00e9s, agents internes, prestataires", { width: 6526 })] }),
            new TableRow({ children: [cell("Sous-traitants", { shade: "DEEAF1", bold: true, width: 2500 }), completionCell("[\u00c0 compl\u00e9ter : fournisseur IA, h\u00e9bergeur]", 6526)] }),
            new TableRow({ children: [cell("Transferts hors UE", { shade: "DEEAF1", bold: true, width: 2500 }), cell("Oui \u2014 USA \u2014 SCCs 2021 (C2P)", { width: 6526 })] }),
          ]
        }),
        ...spacer(2),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "Annexe B \u2014 Liste des sous-traitants et DPA", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [2500, 1800, 1800, 1600, 1326],
          rows: [
            new TableRow({ children: [hCell("Sous-traitant", 2500), hCell("Service fourni", 1800), hCell("Pays", 1800), hCell("DPA sign\u00e9 ?", 1600), hCell("SCCs ?", 1326)] }),
            new TableRow({ children: [
              completionCell("[Nom fournisseur IA]", 2500),
              cell("Service d\u2019IA (LLM, API)", { width: 1800 }),
              cell("\u00c9tats-Unis", { width: 1800 }),
              completionCell("\u00c0 signer", 1600),
              completionCell("Module C2P", 1326),
            ]}),
            new TableRow({ children: [
              completionCell("[Nom h\u00e9bergeur cloud]", 2500),
              cell("H\u00e9bergement infrastructure", { width: 1800 }),
              completionCell("[\u00c0 pr\u00e9ciser]", 1800),
              completionCell("\u00c0 v\u00e9rifier", 1600),
              completionCell("\u00c0 v\u00e9rifier", 1326),
            ]}),
          ]
        }),
        ...spacer(2),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: "Annexe C \u2014 R\u00e9f\u00e9rences r\u00e9glementaires", bold: true, size: 24, color: "2E75B6", font: "Arial" })]
        }),
        bullet("R\u00e8glement (UE) 2016/679 du Parlement europ\u00e9en (RGPD) \u2014 art. 5, 6, 13, 24, 28, 30, 32, 33, 35"),
        bullet("Lignes directrices WP248 du CEPD sur l\u2019AIPD (r\u00e9vis\u00e9 en 2017) \u2014 m\u00e9thodologie en 4 \u00e9tapes"),
        bullet("Recommandation CNIL n\u00b02006-066 sur la conservation des logs de connexion"),
        bullet("D\u00e9cision d\u2019ex\u00e9cution (UE) 2021/914 de la Commission europ\u00e9enne \u2014 Clauses Contractuelles Types (SCCs, juin 2021)"),
        bullet("Lignes directrices 01/2020 du CEPD sur les Clauses Contractuelles Types"),
        bullet("Recommandation 01/2020 du CEPD sur les mesures qui compl\u00e8tent les SCCs (Transfer Impact Assessment)"),
        bullet("M\u00e9thodologie CNIL AIPD \u2014 Guide de la CNIL sur la r\u00e9alisation d\u2019une AIPD (2018, mis \u00e0 jour)"),
      ],

      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F4E79" } },
              spacing: { before: 0, after: 120 },
              children: [
                new TextRun({ text: "AIPD \u2014 Gestion des acc\u00e8s aux outils IA | PIA-IA-2026-001", size: 18, color: "595959", font: "Arial" }),
                new TextRun({ text: "  \u2014  CONFIDENTIEL", bold: true, size: 18, color: "C00000", font: "Arial" }),
              ]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              border: { top: { style: BorderStyle.SINGLE, size: 6, color: "1F4E79" } },
              spacing: { before: 120, after: 0 },
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Page ", size: 18, color: "595959", font: "Arial" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "595959", font: "Arial" }),
                new TextRun({ text: " sur ", size: 18, color: "595959", font: "Arial" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "595959", font: "Arial" }),
                new TextRun({ text: "  |  [Nom de l\u2019organisation]  |  Mars 2026", size: 18, color: "595959", font: "Arial" }),
              ]
            })
          ]
        })
      }
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("PIA_Gestion_Acces_Outils_IA_2026.docx", buffer);
  console.log("Document generated: PIA_Gestion_Acces_Outils_IA_2026.docx");
}).catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
