# Content Structure Scorer Skill

`content-structure-scorer`는 작성 구조/전략 파일과 실제 원고를 비교해 콘텐츠가 구조대로 작성됐는지, AEO/SEO 전략을 잘 따랐는지 점수화하는 Codex 스킬입니다.

## What It Does

- `.xlsx` 작성 구조 파일을 읽고 구조 템플릿과 작성 규칙을 추출합니다.
- 원고 텍스트, `.docx`, `.txt`, `.md` 파일을 분석합니다.
- 구조 준수도, 작성 규칙 준수도, AEO, SEO, 편집 품질을 100점 기준으로 평가합니다.
- 대시보드형 HTML 아티팩트 또는 Markdown 리포트로 결과를 정리합니다.

## Folder Structure

```text
content-structure-scorer/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── assets/
│   └── dashboard-report-template.html
├── references/
│   ├── report-format.md
│   └── scoring-rubric.md
└── scripts/
    └── extract_content_inputs.py
```

## Installation

이 저장소의 `content-structure-scorer` 폴더를 로컬 Codex 스킬 폴더에 복사합니다.

```bash
mkdir -p ~/.codex/skills
cp -R content-structure-scorer ~/.codex/skills/
```

Codex 앱에서 스킬 목록이 바로 갱신되지 않으면 앱을 새로고침하거나 재시작하세요.

## Usage

Codex에서 아래처럼 요청합니다.

```text
content-structure-scorer 스킬로 구조 파일과 원고를 비교해서 점수화해줘.
```

대시보드 아티팩트가 필요하면 이렇게 요청합니다.

```text
content-structure-scorer 스킬로 구조 파일과 원고를 비교해서, 대시보드 아티팩트로 보여줘.
```

## Supported Inputs

- Structure file: `.xlsx`
- Draft file: `.docx`, `.txt`, `.md`
- Draft text: pasted text

Google Docs, Google Sheets, Notion 링크는 Codex 환경에서 접근 권한이나 커넥터가 있을 때만 사용할 수 있습니다. 접근이 막히면 텍스트를 붙여넣거나 파일로 내보내서 사용하세요.

## Scoring

총점은 100점입니다.

- 구조 준수도: 35점
- 작성 규칙 준수도: 25점
- AEO 최적화: 20점
- SEO 최적화: 15점
- 편집 품질: 5점

## Notes

이 저장소는 웹앱이 아니라 Codex 스킬 공유용 패키지입니다. GitHub에 올려도 웹사이트처럼 실행되는 것은 아니며, Codex 사용자가 로컬 스킬 폴더에 설치해서 사용하는 방식입니다.
