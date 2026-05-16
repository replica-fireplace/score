import React from "react";
import { createRoot } from "react-dom/client";
import { AlertCircle, CheckCircle2, ClipboardCheck, FileSpreadsheet, FileText, Gauge, Search, UploadCloud } from "lucide-react";
import JSZip from "jszip";
import "./styles.css";

type StructureRule = {
  section: string;
  type: string;
  instruction: string;
  methodology: string;
};

type RuleGuide = {
  label: string;
  rule: string;
};

type FindingStatus = "pass" | "warning" | "fail" | "missing";

type SectionFinding = {
  section: string;
  label: string;
  status: FindingStatus;
  score: number;
  maxScore: number;
  standard: string;
  evidence: string;
  complied: string[];
  actions: string[];
  suggestion: string;
};

type ScoreReport = {
  total: number;
  structure: number;
  rules: number;
  aeo: number;
  seo: number;
  editorial: number;
  diagnosis: string;
  priorities: string[];
  findings: SectionFinding[];
};

const sampleDraft = `서버호스팅 vs 클라우드: 핵심 차이와 선택 기준

서버호스팅과 클라우드는 모두 기업의 서비스를 안정적으로 운영하기 위한 인프라 방식입니다. 다만 비용 구조, 확장 방식, 운영 책임이 다르기 때문에 현재 서비스 규모와 운영 역량에 맞춰 선택해야 합니다.

서버호스팅과 클라우드는 무엇이 다를까?
서버호스팅은 물리 서버 자원을 안정적으로 사용하는 방식이고, 클라우드는 필요한 만큼 자원을 유연하게 늘리고 줄이는 방식입니다.

서버호스팅이란 무엇인가?
서버호스팅은 한 기업이 독립된 물리 서버를 임대하거나 운영하는 방식입니다. 전용 장비를 쓰기 때문에 성능 예측이 쉽고, 특정 워크로드가 꾸준히 발생하는 서비스에 적합합니다. 대신 초기 설정과 운영 관리 책임이 비교적 큽니다.

클라우드란 무엇인가?
클라우드는 가상화된 컴퓨팅 자원을 필요한 만큼 사용하는 방식입니다. 트래픽 변화에 맞춰 자원을 빠르게 확장할 수 있고, 사용량 기반 과금으로 시작 부담을 낮출 수 있습니다. 다만 비용 관리와 아키텍처 설계가 중요합니다.

서버호스팅 vs 클라우드: 핵심 차이점
| 비교 항목 | 서버호스팅 | 클라우드 |
| 비용 구조 | 고정비 중심 | 사용량 기반 |
| 확장성 | 장비 증설 필요 | 즉시 확장 가능 |
| 운영 난이도 | 직접 관리 비중 높음 | 관리형 서비스 활용 가능 |
| 성능 예측 | 안정적 | 설계에 따라 달라짐 |
| 적합 상황 | 안정적 트래픽 | 변동성 큰 서비스 |

내 상황에 맞는 선택은?
서버호스팅이 맞는 상황
트래픽이 일정하고 성능 예측이 중요한 서비스라면 서버호스팅이 적합합니다. 고정 비용으로 예산을 관리하기 쉽고, 전용 자원을 기반으로 안정적인 운영 환경을 만들 수 있습니다.

클라우드가 맞는 상황
서비스 초기 단계이거나 트래픽 변동이 큰 환경이라면 클라우드가 적합합니다. 필요한 만큼만 자원을 쓰면서 빠르게 확장할 수 있어 신규 서비스나 캠페인성 서비스에 유리합니다.

자주 묻는 질문
서버호스팅과 클라우드 중 무엇이 더 저렴한가요?
사용량과 운영 방식에 따라 다릅니다.`;

function normalize(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function includesAny(text: string, words: string[]) {
  const source = text.toLowerCase();
  return words.some((word) => source.includes(word.toLowerCase()));
}

function countKoreanChars(text: string) {
  return text.replace(/\s/g, "").length;
}

function statusMeta(status: FindingStatus) {
  switch (status) {
    case "pass":
      return { label: "통과", className: "status-pass" };
    case "warning":
      return { label: "개선 필요", className: "status-warning" };
    case "fail":
      return { label: "부족", className: "status-fail" };
    case "missing":
      return { label: "누락", className: "status-missing" };
  }
}

async function parseStructureFile(file: File): Promise<{ rules: StructureRule[]; title: string }> {
  const buffer = await file.arrayBuffer();
  const workbook = await readWorkbook(buffer);
  const rows = workbook.sheets[0]?.rows || [];
  const title = rows[0]?.[0] || file.name;

  const rules = rows
    .slice(2)
    .filter((row) => row[0] || row[1] || row[2])
    .map((row) => ({
      section: String(row[0] || "").trim(),
      type: String(row[1] || "").trim(),
      instruction: String(row[2] || "").trim(),
      methodology: String(row[3] || "").trim(),
    }));

  return { rules, title: String(title) };
}

async function parseWritingRulesFile(file: File): Promise<{ guides: RuleGuide[]; title: string }> {
  const buffer = await file.arrayBuffer();
  const workbook = await readWorkbook(buffer);
  const rulesSheet =
    workbook.sheets.find((sheet) => sheet.rows.some((row) => row.join(" ").includes("섹션별 분량") || row.join(" ").includes("작성 규칙"))) ||
    workbook.sheets[0];
  const rows = rulesSheet?.rows || [];
  const title = rows[0]?.[0] || file.name;
  const guides = rows
    .slice(1)
    .filter((row) => row[0] || row[1])
    .map((row) => ({
      label: String(row[0] || "").trim(),
      rule: String(row[1] || "").trim(),
    }));

  return { guides, title: String(title) };
}

function columnIndex(cellRef: string) {
  const letters = cellRef.replace(/[^A-Z]/gi, "").toUpperCase();
  return letters.split("").reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

async function readWorkbook(buffer: ArrayBuffer) {
  const zip = await JSZip.loadAsync(buffer);
  const parser = new DOMParser();
  const readXml = async (path: string) => {
    const file = zip.file(path);
    if (!file) throw new Error(`${path} 파일을 찾을 수 없습니다.`);
    return parser.parseFromString(await file.async("text"), "application/xml");
  };

  const sharedDoc = zip.file("xl/sharedStrings.xml")
    ? await readXml("xl/sharedStrings.xml")
    : null;
  const sharedStrings = sharedDoc
    ? Array.from(sharedDoc.getElementsByTagName("si")).map((node) =>
        Array.from(node.getElementsByTagName("t")).map((textNode) => textNode.textContent || "").join("")
      )
    : [];

  const workbookDoc = await readXml("xl/workbook.xml");
  const relsDoc = await readXml("xl/_rels/workbook.xml.rels");
  const rels = new Map(
    Array.from(relsDoc.getElementsByTagName("Relationship")).map((rel) => [
      rel.getAttribute("Id") || "",
      rel.getAttribute("Target") || "",
    ])
  );

  const sheets = await Promise.all(
    Array.from(workbookDoc.getElementsByTagName("sheet")).map(async (sheet) => {
      const relId = sheet.getAttribute("r:id") || "";
      const target = rels.get(relId) || "";
      const sheetPath = target.startsWith("/") ? target.slice(1) : target.startsWith("xl/") ? target : `xl/${target}`;
      const sheetDoc = await readXml(sheetPath);
      const rows = Array.from(sheetDoc.getElementsByTagName("row")).map((row) => {
        const cells: string[] = [];
        Array.from(row.getElementsByTagName("c")).forEach((cell) => {
          const ref = cell.getAttribute("r") || "A1";
          const index = columnIndex(ref);
          while (cells.length < index) cells.push("");
          const valueNode = cell.getElementsByTagName("v")[0];
          const inlineNode = cell.getElementsByTagName("t")[0];
          let value = valueNode?.textContent || inlineNode?.textContent || "";
          if (cell.getAttribute("t") === "s" && value) value = sharedStrings[Number(value)] || "";
          cells[index] = value;
        });
        return cells;
      });
      return { name: sheet.getAttribute("name") || "", rows };
    })
  );

  return { sheets };
}

function nonEmptyBlocks(draft: string) {
  return draft
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function detectSectionText(draft: string, rule: StructureRule, nextSection?: string) {
  const section = rule.section;
  const blocks = nonEmptyBlocks(draft);
  const cleanedSection = section.split("\n")[0].trim();
  if (!cleanedSection) return "";

  if (/^H1$/i.test(cleanedSection)) return blocks[0] || "";
  if (/도입부/i.test(cleanedSection)) return blocks[1] || "";

  if (/H2-1/i.test(cleanedSection)) {
    return blocks.find((block) => /다를까|한 줄|정리하면|차이|무엇이 다른/i.test(block)) || "";
  }

  if (/H2-[234]/i.test(cleanedSection)) {
    const definitions = blocks.filter((block) => /이란 무엇인가|란 무엇인가|정의|개념/i.test(block));
    const index = Number(cleanedSection.match(/H2-(\d)/)?.[1] || "2") - 2;
    return definitions[index] || "";
  }

  if (/H2-5/i.test(cleanedSection)) {
    return blocks.find((block) => /핵심 차이|차이점|비교표|비교 항목|\|/i.test(block)) || "";
  }

  if (/H2-6/i.test(cleanedSection)) {
    const selectionBlocks = blocks.filter((block) => /맞는 상황|선택|적합|조건/i.test(block));
    if (/H3-1/i.test(section)) return selectionBlocks[1] || selectionBlocks[0] || "";
    if (/H3-2/i.test(section)) return selectionBlocks[2] || selectionBlocks[1] || "";
    if (/H3-3/i.test(section)) return selectionBlocks[3] || "";
    return selectionBlocks[0] || "";
  }

  if (/FAQ/i.test(cleanedSection) || /FAQ/i.test(rule.type + rule.instruction)) {
    return blocks.find((block) => /자주 묻는 질문|FAQ|Q\.|질문/i.test(block)) || "";
  }

  const escaped = cleanedSection.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const start = draft.search(new RegExp(escaped, "i"));
  if (start < 0) return "";
  const fromStart = draft.slice(start);
  if (!nextSection) return fromStart.slice(0, 900);
  const nextCleaned = nextSection.split("\n")[0].trim();
  const nextIndex = fromStart.slice(cleanedSection.length).search(new RegExp(nextCleaned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  return nextIndex >= 0 ? fromStart.slice(0, cleanedSection.length + nextIndex) : fromStart.slice(0, 900);
}

function scoreSection(rule: StructureRule, draft: string, nextRule?: StructureRule): SectionFinding {
  const sectionText = detectSectionText(draft, rule, nextRule?.section);
  const draftNorm = normalize(draft);
  const instruction = normalize(rule.instruction);
  const methodology = normalize(rule.methodology);
  const foundByLabel = sectionText.length > 0 || includesAny(draftNorm, [rule.section, rule.type]);

  let score = foundByLabel ? 6 : 0;
  const maxScore = 10;
  const complied: string[] = [];
  const actions: string[] = [];
  let suggestion = "구조 기준에 맞춰 섹션의 목적과 첫 문장을 다시 점검하세요.";

  if (foundByLabel) complied.push("원고에서 대응되는 섹션 또는 유사한 내용이 확인됩니다.");
  else actions.push("구조 파일에 있는 필수 섹션을 원고에 추가하세요.");

  if (/40~60자|직접 답변|Featured Snippet|AI Overview/i.test(instruction + methodology)) {
    const firstSentence = sectionText.split(/[.!?。]|다\./)[0] || sectionText;
    const charCount = countKoreanChars(firstSentence);
    if (charCount >= 35 && charCount <= 80) {
      score += 2;
      complied.push("소제목 직후 직접 답변 길이가 비교적 적절합니다.");
    } else {
      actions.push("소제목 바로 아래 직접 답변을 40~60자 안팎의 한 문장으로 압축하세요.");
      suggestion = "핵심 차이를 한 문장으로 먼저 답하고, 세부 설명은 다음 문단으로 분리하세요.";
    }
  }

  if (/비교표|마크다운 테이블|표/i.test(instruction + methodology)) {
    if (draft.includes("|") && draft.includes("---")) {
      score += 2;
      complied.push("비교표 형식이 확인됩니다.");
    } else if (draft.includes("|")) {
      score += 1;
      complied.push("표 형태의 비교 요소가 일부 확인됩니다.");
      actions.push("마크다운 테이블 구분선과 항목별 해설을 보강하세요.");
    } else {
      actions.push("비교표를 추가하고 각 항목 아래 1~2줄 해설을 붙이세요.");
      suggestion = "비교 항목, A 방식, B 방식, 선택 기준을 표로 정리한 뒤 항목별 해설을 추가하세요.";
    }
  }

  if (/H3|조건|동일|균형|상황/i.test(instruction + methodology) && /선택 가이드/i.test(rule.type + rule.instruction)) {
    if (includesAny(sectionText, ["상황", "적합", "맞는", "조건"])) {
      score += 1;
      complied.push("상황별 선택 기준이 일부 반영되어 있습니다.");
    } else {
      actions.push("각 선택지별로 조건 수와 분량을 맞추고, 우열 단정 표현을 피하세요.");
      suggestion = "각 H3를 ‘현재 상황 → 필요한 이유 → 적합한 선택’ 순서로 같은 분량으로 작성하세요.";
    }
  }

  if (/Semantic SEO|키워드|검색어|SEO/i.test(instruction + methodology)) {
    if (includesAny(sectionText || draft, ["차이", "비교", "선택", "비용", "보안", "확장"])) {
      score += 1;
      complied.push("비교/선택 의도와 관련된 키워드가 확인됩니다.");
    } else {
      actions.push("검색 의도에 맞는 핵심 키워드와 연관어를 섹션 첫 문단에 자연스럽게 배치하세요.");
    }
  }

  score = Math.min(maxScore, score);
  let status: FindingStatus = "pass";
  if (!foundByLabel) status = "missing";
  else if (score < 5) status = "fail";
  else if (score < 8) status = "warning";

  if (actions.length === 0) actions.push("큰 추가 작업은 없습니다. 현재 구조를 유지하세요.");

  return {
    section: rule.section,
    label: rule.type || rule.section,
    status,
    score,
    maxScore,
    standard: [rule.instruction, rule.methodology].filter(Boolean).join("\n"),
    evidence: sectionText ? sectionText.slice(0, 220) : "원고에서 명확한 대응 섹션을 찾지 못했습니다.",
    complied,
    actions,
    suggestion,
  };
}

function buildReport(rules: StructureRule[], guides: RuleGuide[], draft: string): ScoreReport {
  const coreRules = rules.filter((rule) => /^(H1|도입부|H2|FAQ|CTA)/i.test(rule.section));
  const findings = coreRules.map((rule, index) => scoreSection(rule, draft, coreRules[index + 1]));
  const average = findings.length ? findings.reduce((sum, item) => sum + item.score, 0) / findings.length : 0;
  const missingCount = findings.filter((item) => item.status === "missing").length;
  const warningCount = findings.filter((item) => item.status === "warning" || item.status === "fail").length;
  const hasFaq = /FAQ|자주 묻는 질문|Q\./i.test(draft);
  const hasTable = draft.includes("|");
  const hasDirectAnswer = findings.some((item) => /직접 답변|핵심 요약/i.test(item.label + item.standard) && item.status !== "missing");

  const structure = Math.max(0, Math.round((average / 10) * 35) - missingCount);
  const rulesScore = Math.max(0, Math.round((average / 10) * 25) - Math.floor(warningCount / 2));
  const aeo = Math.min(20, (hasDirectAnswer ? 8 : 2) + (hasFaq ? 5 : 1) + (hasTable ? 4 : 1) + 3);
  const seo = Math.min(15, includesAny(draft, ["차이", "비교", "선택"]) ? 12 : 8);
  const editorial = Math.min(5, draft.length > 500 ? 5 : 3);
  const total = Math.min(100, structure + rulesScore + aeo + seo + editorial);

  const actionItems = findings
    .filter((item) => item.status !== "pass")
    .flatMap((item) => item.actions.map((action) => `${item.section}: ${action}`))
    .slice(0, 4);

  const priorities = actionItems.length
    ? actionItems
    : ["현재 구조 준수도가 높습니다. SEO 키워드와 FAQ 답변 길이만 마지막으로 점검하세요."];

  const guideHint = guides.find((guide) => /전체 합산|H2-1|FAQ|비교표/i.test(guide.label + guide.rule));
  const diagnosis = total >= 85
    ? "구조와 작성 규칙을 안정적으로 따르고 있습니다. 일부 섹션의 AEO 압축도만 보완하면 됩니다."
    : `구조의 큰 흐름은 확인되지만 ${missingCount ? "누락 섹션과 " : ""}섹션별 작성 규칙 보완이 필요합니다.${guideHint ? ` 특히 “${guideHint.label}” 기준을 우선 확인하세요.` : ""}`;

  return { total, structure, rules: rulesScore, aeo, seo, editorial, diagnosis, priorities, findings };
}

function App() {
  const [structureTitle, setStructureTitle] = React.useState("");
  const [writingRulesTitle, setWritingRulesTitle] = React.useState("");
  const [rules, setRules] = React.useState<StructureRule[]>([]);
  const [guides, setGuides] = React.useState<RuleGuide[]>([]);
  const [draft, setDraft] = React.useState(sampleDraft);
  const [report, setReport] = React.useState<ScoreReport | null>(null);
  const [selected, setSelected] = React.useState("");
  const [isParsingStructure, setIsParsingStructure] = React.useState(false);
  const [isParsingWritingRules, setIsParsingWritingRules] = React.useState(false);

  const readyToAnalyze = rules.length > 0 && guides.length > 0 && draft.trim().length > 0;

  const handleStructureFile = async (file?: File) => {
    if (!file) return;
    setIsParsingStructure(true);
    try {
      const parsed = await parseStructureFile(file);
      setRules(parsed.rules);
      setStructureTitle(parsed.title);
      setReport(null);
    } finally {
      setIsParsingStructure(false);
    }
  };

  const handleWritingRulesFile = async (file?: File) => {
    if (!file) return;
    setIsParsingWritingRules(true);
    try {
      const parsed = await parseWritingRulesFile(file);
      setGuides(parsed.guides);
      setWritingRulesTitle(parsed.title);
      setReport(null);
    } finally {
      setIsParsingWritingRules(false);
    }
  };

  const analyze = () => {
    if (!readyToAnalyze) return;
    const nextReport = buildReport(rules, guides, draft);
    setReport(nextReport);
    setSelected(nextReport.findings[0]?.section || "");
  };

  const highlightedDraft = React.useMemo(() => {
    const lines = draft.split("\n");
    return lines.map((line, index) => {
      const matched = report?.findings.find((finding) => normalize(line).includes(finding.section.split("\n")[0]) || normalize(line).includes(finding.label.split("\n")[0]));
      const meta = matched ? statusMeta(matched.status) : null;
      return (
        <div
          key={`${line}-${index}`}
          className={`draft-line ${matched ? `draft-${matched.status}` : ""}`}
          onClick={() => matched && setSelected(matched.section)}
        >
          {matched && <span className={`line-dot ${meta?.className}`} />}
          <span>{line || "\u00A0"}</span>
        </div>
      );
    });
  }, [draft, report]);

  const activeFinding = report?.findings.find((finding) => finding.section === selected) || report?.findings[0];

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="subtle">Content Structure Scorer</p>
          <h1>콘텐츠 구조 스코어러</h1>
        </div>
        <div className="topbar-actions">
          <label className="upload-button">
            <UploadCloud size={18} />
            구조 업로드
            <input type="file" accept=".xlsx,.xls" onChange={(event) => handleStructureFile(event.target.files?.[0])} />
          </label>
          <label className="upload-button">
            <UploadCloud size={18} />
            작성규칙 업로드
            <input type="file" accept=".xlsx,.xls" onChange={(event) => handleWritingRulesFile(event.target.files?.[0])} />
          </label>
          <button className="primary-button" onClick={analyze} disabled={!readyToAnalyze}>
            <Gauge size={18} />
            분석 실행
          </button>
        </div>
      </header>

      <section className="setup-strip">
        <div className="setup-card">
          <FileSpreadsheet size={20} />
          <div>
            <strong>{structureTitle || "구조 파일이 필요합니다"}</strong>
            <span>{isParsingStructure ? "구조 파일을 읽는 중입니다" : rules.length ? `${rules.length}개 구조 행 감지` : "1번 .xlsx 구조 파일을 업로드하세요"}</span>
          </div>
        </div>
        <div className="setup-card">
          <FileSpreadsheet size={20} />
          <div>
            <strong>{writingRulesTitle || "작성규칙 파일이 필요합니다"}</strong>
            <span>{isParsingWritingRules ? "작성규칙 파일을 읽는 중입니다" : guides.length ? `${guides.length}개 작성 규칙 감지` : "2번 .xlsx 작성규칙 파일을 업로드하세요"}</span>
          </div>
        </div>
        <div className="setup-card">
          <FileText size={20} />
          <div>
            <strong>원고 텍스트</strong>
            <span>{countKoreanChars(draft).toLocaleString()}자, 붙여넣기 방식 MVP</span>
          </div>
        </div>
        <div className="setup-card">
          <Search size={20} />
          <div>
            <strong>평가 기준</strong>
            <span>구조 준수도, 작성 규칙, AEO, SEO, 편집 품질</span>
          </div>
        </div>
      </section>

      <section className="dashboard">
        <div className="score-hero">
          <span>전체 점수</span>
          <strong>{report ? report.total : "--"}<small>/100</small></strong>
        </div>
        <ScoreTile label="구조 준수도" value={report?.structure} max={35} />
        <ScoreTile label="작성 규칙" value={report?.rules} max={25} />
        <ScoreTile label="AEO" value={report?.aeo} max={20} />
        <ScoreTile label="SEO" value={report?.seo} max={15} />
        <ScoreTile label="편집 품질" value={report?.editorial} max={5} />
        <div className="diagnosis">
          <strong>핵심 진단</strong>
          <p>{report?.diagnosis || "구조 파일, 작성규칙 파일, 원고를 준비한 뒤 분석을 실행하면 핵심 진단이 표시됩니다."}</p>
        </div>
        <div className="priorities">
          <strong>개선 우선순위</strong>
          {(report?.priorities || ["구조 파일 업로드", "작성규칙 파일 업로드", "원고 텍스트 입력", "분석 실행"]).map((item, index) => (
            <p key={item}><span>{index + 1}</span>{item}</p>
          ))}
        </div>
      </section>

      <section className="workspace">
        <aside className="input-panel">
          <h2>입력</h2>
          <label className="dropzone">
            <FileSpreadsheet size={28} />
            <strong>1. .xlsx 구조 파일 업로드</strong>
            <span>섹션, 유형, 제목/작성 지침, 적용 방법론을 읽습니다.</span>
            <input type="file" accept=".xlsx,.xls" onChange={(event) => handleStructureFile(event.target.files?.[0])} />
          </label>
          <label className="dropzone compact">
            <FileSpreadsheet size={28} />
            <strong>2. .xlsx 작성규칙 파일 업로드</strong>
            <span>섹션별 분량 기준, AEO/SEO 체크리스트를 읽습니다.</span>
            <input type="file" accept=".xlsx,.xls" onChange={(event) => handleWritingRulesFile(event.target.files?.[0])} />
          </label>
          <label className="text-label" htmlFor="draft">작성 콘텐츠</label>
          <textarea
            id="draft"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setReport(null);
            }}
          />
          <button className="wide-button" onClick={analyze} disabled={!readyToAnalyze}>
            <ClipboardCheck size={18} />
            전체 스코어링 실행
          </button>
        </aside>

        <section className="draft-panel">
          <div className="panel-heading">
            <h2>원고 텍스트</h2>
            <span>문제 섹션은 색상으로 표시됩니다.</span>
          </div>
          <div className="draft-view">{highlightedDraft}</div>
        </section>

        <section className="feedback-panel">
          <div className="panel-heading">
            <h2>구조별 준수/추가 작업</h2>
            <span>{report ? `${report.findings.length}개 섹션 평가` : "분석 전"}</span>
          </div>
          {report ? (
            <div className="feedback-grid">
              <div className="section-list">
                {report.findings.map((finding) => {
                  const meta = statusMeta(finding.status);
                  return (
                    <button
                      key={finding.section}
                      className={`section-chip ${selected === finding.section ? "active" : ""}`}
                      onClick={() => setSelected(finding.section)}
                    >
                      <span>{finding.section}</span>
                      <em className={meta.className}>{meta.label}</em>
                    </button>
                  );
                })}
              </div>
              {activeFinding && <FindingDetail finding={activeFinding} />}
            </div>
          ) : (
            <div className="empty-state">
              <AlertCircle size={28} />
              <strong>아직 분석 결과가 없습니다.</strong>
              <p>구조 파일과 작성규칙 파일을 업로드하고 원고를 입력한 뒤 분석을 실행하세요.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function ScoreTile({ label, value, max }: { label: string; value?: number; max: number }) {
  const percent = value === undefined ? 0 : Math.round((value / max) * 100);
  return (
    <div className="score-tile">
      <span>{label}</span>
      <strong>{value ?? "--"}<small>/{max}</small></strong>
      <div className="bar"><i style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

function FindingDetail({ finding }: { finding: SectionFinding }) {
  const meta = statusMeta(finding.status);
  return (
    <article className="finding-detail">
      <div className="finding-title">
        <div>
          <p>{finding.section}</p>
          <h3>{finding.label}</h3>
        </div>
        <span className={meta.className}>{meta.label}</span>
      </div>
      <div className="mini-score">
        <span>섹션 점수</span>
        <strong>{finding.score}/{finding.maxScore}</strong>
      </div>
      <section>
        <h4>구조 기준</h4>
        <p>{finding.standard}</p>
      </section>
      <section>
        <h4>현재 원고</h4>
        <p>{finding.evidence}</p>
      </section>
      <section>
        <h4>준수한 부분</h4>
        {finding.complied.map((item) => <p className="check-row" key={item}><CheckCircle2 size={15} />{item}</p>)}
      </section>
      <section>
        <h4>추가 작업</h4>
        {finding.actions.map((item) => <p className="action-row" key={item}>{item}</p>)}
      </section>
      <section className="suggestion">
        <h4>추천 수정 방향</h4>
        <p>{finding.suggestion}</p>
      </section>
    </article>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
