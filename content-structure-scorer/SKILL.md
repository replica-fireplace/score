---
name: content-structure-scorer
description: Score and review Korean content drafts against an uploaded writing-structure/strategy file. Use when the user asks to compare a content structure file, usually .xlsx, with a draft in pasted text, .docx, .txt, or .md; evaluate structure compliance, section rules, AEO, SEO, and editorial quality; produce a dashboard-style score report and section-by-section revision guidance.
---

# Content Structure Scorer

## Overview

Use this skill to evaluate whether a finished content draft follows a predefined content structure and strategy document. The expected output is a Korean scoring report with a top dashboard, then draft-linked section feedback and concrete next actions.

## Inputs

Accept any of these combinations:

- Structure file: `.xlsx` preferred. Treat sheets named like `구조`, `구조 템플릿`, `작성 규칙`, `파트1`, `파트2` as authoritative.
- Draft: pasted text, `.docx`, `.txt`, or `.md`.
- Optional draft source: Google Docs, Google Sheets, or Notion links. If connector/API access is not available, ask the user to paste text or export/download to a supported file.

## Workflow

1. Identify the structure file and draft input.
2. If files are provided, run `scripts/extract_content_inputs.py` to extract readable text and basic heading/section signals.
3. Read `references/scoring-rubric.md` before scoring.
4. Read `references/report-format.md` before writing the final report.
5. If the user asks for an artifact, dashboard, visual report, or shareable report, create a standalone HTML dashboard using `assets/dashboard-report-template.html` as the visual pattern.
6. Compare the draft against the structure in this order:
   - required section presence
   - section order and hierarchy
   - section intent and writing-rule compliance
   - AEO/direct-answer readiness
   - SEO/search-intent readiness
   - editorial quality
7. Produce a score out of 100 and section-level feedback in Korean.

## Extraction

Use the extraction script for supported files:

```bash
python3 /path/to/content-structure-scorer/scripts/extract_content_inputs.py \
  --structure "/path/to/structure.xlsx" \
  --draft "/path/to/draft.docx"
```

For pasted draft text, save it only if needed; otherwise analyze directly. If saving is useful, write it to a temporary `.txt` file and pass it with `--draft`.

The script outputs JSON with:

- `structure`: extracted sheet/table text and inferred rows
- `draft`: raw text, heading list, and rough section blocks
- `warnings`: unsupported or partially parsed items

## Scoring Rules

Use the fixed 100-point rubric from `references/scoring-rubric.md` unless the user gives a different rubric.

Default category weights:

- 구조 준수도: 35
- 작성 규칙 준수도: 25
- AEO 최적화: 20
- SEO 최적화: 15
- 편집 품질: 5

Do not inflate scores because a section "sounds good." Award points for evidence that the draft follows the structure file. If a rule is ambiguous, state the assumption and score conservatively.

## Report Requirements

Always include:

- top dashboard with total score and category scores
- key diagnosis in 2-4 sentences
- improvement priorities, ordered by impact
- section-by-section compliance cards
- specific additional work needed for each weak section
- suggested rewrite examples when the issue is actionable at sentence or paragraph level

Prefer concise, editorially useful feedback over generic SEO advice. Tie every major finding to either the structure file or a visible part of the draft.

## Dashboard Artifact

When generating an artifact:

- Create a standalone `.html` file in the current workspace unless the user specifies another location.
- Use the layout from `assets/dashboard-report-template.html`:
  - top score dashboard
  - category score cards
  - key diagnosis and priority list
  - lower two-column review area
  - left column: draft text grouped by headings
  - right column: section compliance cards and next actions
- Keep all CSS inside the HTML file so it can be opened locally without a build step.
- Do not invent hidden data. If the report is based on assumptions or partial parsing, show a small `분석 기준` or `주의` note.
- After creating the artifact, return a clickable file link and a short summary.

## Link/Connector Fallbacks

When a user provides a Google Docs, Google Sheets, or Notion link:

- Use available connectors or browser tools only if already available and appropriate.
- If access is blocked by login, permissions, or unavailable tools, ask for one of:
  - exported `.docx`, `.txt`, `.md`, or `.xlsx`
  - copied text
  - public CSV/TSV export for sheets
- Keep the first version free-tool friendly: no paid SaaS dependency is required beyond the user's AI runtime.
