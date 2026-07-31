/**
 * 검색어로 실제 데이터 하나를 고른다.
 *
 * 챗봇에게 글 id 목록을 통째로 주지 않는 이유가 여기 있다. 프롬프트가
 * 커지는 것도 문제지만, 더 나쁜 건 모델이 없는 id를 지어내는 것이다.
 * `p-9999`로 이동하면 빈 화면이 뜨고, 방문자 눈에는 챗봇이 고장 난 것으로
 * 보인다. 검색어를 받아 **있는 것 중에서** 고르면 그런 일이 없다.
 * 못 고르면 못 골랐다고 말한다. 그게 정확하다.
 *
 * 점수는 단순하게 매긴다. 제목에 그대로 들어 있으면 가장 높고, 낱말이
 * 겹치는 만큼 더한다. 형태소 분석까지 갈 일이 아니다. 후보가 수백 개고
 * 방문자는 "그 신규 거래처 글" 정도로 말한다.
 */

import { ALL_POSTS, type Post } from "@/lib/seed/posts";
import { jobsWithCompany, type JobWithCompany } from "@/lib/seed/jobs";

/** 검색어를 낱말로 쪼갠다. 조사와 한 글자는 버린다 */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((word) => word.replace(/(은|는|이|가|을|를|의|에|에서|으로|로)$/u, ""))
    .filter((word) => word.length > 1);
}

function score(haystack: string, query: string, terms: string[]): number {
  const hay = haystack.toLowerCase();
  // 통째로 들어 있으면 다른 후보와 겨룰 필요가 없다
  let total = hay.includes(query.toLowerCase()) ? 100 : 0;
  for (const term of terms) {
    if (hay.includes(term)) total += term.length;
  }
  return total;
}

/** 가장 잘 맞는 글. 하나도 안 걸리면 null */
export function findPost(query: string): Post | null {
  const terms = words(query);
  if (!terms.length && !query.trim()) return null;

  let best: Post | null = null;
  let bestScore = 0;
  for (const post of ALL_POSTS) {
    // 제목을 가장 무겁게 본다. 방문자는 대개 제목으로 기억한다
    const points =
      score(post.title, query, terms) * 3 +
      score(post.board, query, terms) * 2 +
      score(post.body, query, terms);
    if (points > bestScore) {
      bestScore = points;
      best = post;
    }
  }
  return bestScore > 0 ? best : null;
}

/** 가장 잘 맞는 공고. 하나도 안 걸리면 null */
export function findJob(query: string): JobWithCompany | null {
  const terms = words(query);
  if (!terms.length && !query.trim()) return null;

  let best: JobWithCompany | null = null;
  let bestScore = 0;
  for (const job of jobsWithCompany()) {
    const points =
      score(job.title, query, terms) * 3 +
      score(job.company.name, query, terms) * 3 +
      score(job.workplace, query, terms) +
      score(job.career, query, terms);
    if (points > bestScore) {
      bestScore = points;
      best = job;
    }
  }
  return bestScore > 0 ? best : null;
}
