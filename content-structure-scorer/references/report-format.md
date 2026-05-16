# Report Format

Write the report in Korean. Use this structure unless the user requests a different format.

If the user asks for an artifact, dashboard, or visual report, create a standalone HTML report instead of only returning Markdown. Use `assets/dashboard-report-template.html` as the visual pattern and keep the same information hierarchy.

## 1. 스코어링 대시보드

Include:

- `전체 점수: NN/100`
- `구조 준수도: NN/35`
- `작성 규칙 준수도: NN/25`
- `AEO 최적화: NN/20`
- `SEO 최적화: NN/15`
- `편집 품질: NN/5`

Then provide:

- `핵심 진단`: 2-4 sentences
- `개선 우선순위`: 3-5 ordered items

## 2. 구조별 준수/추가 작업

For each major section from the structure file, create a compact card:

```markdown
### [섹션명]

상태: 통과 | 개선 필요 | 부족 | 누락

구조 기준:
- ...

현재 원고:
- ...

준수한 부분:
- ...

추가 작업:
- ...

추천 수정:
> ...
```

Omit `추천 수정` only when no rewrite example is useful.

## 3. 원고 반영 체크리스트

End with a concise checklist:

- `[ ] H2-5 비교표 아래 항목별 해설 추가`
- `[ ] H2-1 직접 답변 40-60자로 압축`

## Tone

Be direct, editorial, and practical. Avoid vague praise. Explain what to revise and why it matters for structure, AEO, or SEO.

## HTML Artifact Requirements

The HTML artifact should read like a working review dashboard:

- Header: report title, source file names, generated date if useful.
- Top band: total score, category cards, pass/risk status.
- Diagnosis band: key diagnosis and top improvement priorities.
- Review workspace: two columns.
- Left column: draft preview with headings and light status markers.
- Right column: section cards with `구조 기준`, `현재 원고`, `준수한 부분`, `추가 작업`, `추천 수정`.
- Footer or final band: checklist for copyediting and structure fixes.

Use restrained colors:

- green for `통과`
- amber for `개선 필요`
- red for `부족` or `누락`
- neutral ink and light gray backgrounds for readability

Keep the artifact printable and readable on a 13-inch laptop screen.
