# Content Structure Scorer

콘텐츠 구조 파일과 작성규칙 파일을 업로드한 뒤, 실제 원고가 구조와 AEO/SEO 작성 기준을 얼마나 잘 따르는지 점수화하는 웹앱입니다.

## Features

- `.xlsx` 구조 파일 업로드
- `.xlsx` 작성규칙 파일 업로드
- 원고 텍스트 붙여넣기
- 상단 대시보드형 스코어링
- 원고 텍스트와 구조별 피드백을 나란히 확인
- 구조 준수도, 작성 규칙, AEO, SEO, 편집 품질 점수 표시

## Tech Stack

- React
- TypeScript
- Vite
- JSZip
- Lucide React

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`.

## Build

```bash
npm run build
```

## Notes

현재 버전은 OpenAI API 없이 브라우저에서 동작하는 규칙 기반 MVP입니다. 이후 AI API를 붙이면 섹션별 판단과 추천 수정안을 더 정교하게 만들 수 있습니다.
