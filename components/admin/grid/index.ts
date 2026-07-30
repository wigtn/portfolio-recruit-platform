/**
 * 데이터 그리드 표 킷 — 선행 프로젝트 P1의 관리자 표를 그대로 옮긴 것.
 *
 * 상용 그리드 라이브러리를 넣지 않는다. 라이브러리는 자기 테마·자기 DOM을 함께
 * 들고 오는데, 이 데모의 시안은 선과 톤만으로 구분하는 평면 규칙이라 결국
 * 다시 덮어써야 한다. 필요한 동작(다중 정렬·컬럼 리사이즈·가상 스크롤)만
 * 골라 우리 마크업 위에서 돌린다.
 *
 * 순서·창 계산 같은 순수 로직은 이미 `@wigtn/ui-kit/table/*`에 이식돼 있다.
 * 여기 있는 건 그 코어에 붙는 React 표현 레이어뿐이다.
 */
export { SortHeader, useSortChain, type SortChainEntry } from "./SortHeader";
export { ColumnResizeProvider, useColumnResize } from "./ColumnResize";
export {
  useWindowedRows,
  useFlipRows,
  useVisitedRows,
  type WindowedRows,
} from "./useGridRows";
export { GridToolbar } from "./GridToolbar";
