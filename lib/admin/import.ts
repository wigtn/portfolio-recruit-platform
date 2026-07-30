/**
 * 회사 일괄 등록 파일 파싱 — 콜드스타트 대량 입력(FR-014).
 *
 * 브라우저에서만 돌아야 해서 xlsx 바이너리는 열지 않는다. 엑셀에서 "CSV로 저장"한
 * 파일을 받는다 — 실제 프로젝트에서도 초기 데이터 이관은 대부분 이 경로다.
 *
 * 통째로 거절하지 않고 **행 단위로 사유를 남긴다**. 1,000줄 중 3줄이 틀렸다고
 * 전부 다시 올리게 하면 콜드스타트 입력은 실패한다.
 */

export type ImportRow = {
  line: number;
  name: string;
  industry: string;
  region: string;
};

export type ImportError = { line: number; raw: string; why: string };

export type ImportResult = {
  rows: ImportRow[];
  errors: ImportError[];
  /** 파일 자체가 잘못된 경우 — 이땐 rows가 비어 있다 */
  fatal?: string;
};

const HEADERS = ["회사명", "업종", "지역"];
export const IMPORT_TEMPLATE = `${HEADERS.join(",")}\n◇◇테크,IT,판교\n△△전자,제조,수원\n`;

/** 엑셀에서 CSV로 저장하면 탭이나 세미콜론이 되기도 한다 */
function splitCells(line: string) {
  const sep = line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
  return line.split(sep).map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

export function parseCompanyImport(text: string): ImportResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], errors: [], fatal: "빈 파일이에요." };
  }

  // 첫 줄이 헤더면 건너뛴다 — 없어도 받아준다
  const first = splitCells(lines[0]);
  const hasHeader = first.some((cell) => HEADERS.includes(cell));
  if (hasHeader && !HEADERS.every((header) => first.includes(header))) {
    return {
      rows: [],
      errors: [],
      fatal: `머리글에 ${HEADERS.join(" · ")} 열이 모두 있어야 해요. 지금은 "${first.join(" · ")}"이에요.`,
    };
  }

  const body = hasHeader ? lines.slice(1) : lines;
  const rows: ImportRow[] = [];
  const errors: ImportError[] = [];
  const seen = new Set<string>();

  body.forEach((line, index) => {
    const lineNo = index + (hasHeader ? 2 : 1);
    const [name, industry, region] = splitCells(line);

    if (!name) {
      errors.push({ line: lineNo, raw: line, why: "회사명이 비어 있어요" });
      return;
    }
    if (!industry || !region) {
      errors.push({ line: lineNo, raw: line, why: "업종·지역이 비어 있어요" });
      return;
    }
    if (seen.has(name)) {
      errors.push({ line: lineNo, raw: line, why: "파일 안에서 중복된 회사명" });
      return;
    }
    seen.add(name);
    rows.push({ line: lineNo, name, industry, region });
  });

  return { rows, errors };
}
