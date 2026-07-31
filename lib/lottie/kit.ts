/**
 * Lottie 조립 도구.
 *
 * Lottie는 After Effects가 뽑아내는 포맷이지만 결국 도형과 키프레임을 담은
 * JSON이다. 여기서는 그 JSON을 손으로 쓰지 않고 코드로 짓는다. 손으로 쓰면
 * 키프레임 하나 옮길 때마다 수십 줄을 세어야 해서, 움직임을 다듬는 작업이
 * 사실상 불가능하다.
 *
 * 이징은 프리셋으로 고정한다. 장면마다 다른 곡선을 쓰면 네 장면이 한 세트로
 * 안 읽힌다. 튀는 맛(overshoot)은 y가 1을 넘는 곡선으로 낸다.
 */

export type Num3 = [number, number, number];

/** 고정값 */
export function st<T>(k: T) {
  return { a: 0 as const, k };
}

type Ease = { i: { x: number[]; y: number[] }; o: { x: number[]; y: number[] } };

/** 부드럽게 도착 */
export const OUT: Ease = {
  o: { x: [0.33], y: [0] },
  i: { x: [0.16], y: [1] },
};
/** 들어갔다 나오는 기본 곡선 */
export const IO: Ease = {
  o: { x: [0.65], y: [0] },
  i: { x: [0.35], y: [1] },
};
/** 살짝 넘쳤다 돌아오는 맛 */
export const POP: Ease = {
  o: { x: [0.34], y: [0] },
  i: { x: [0.64], y: [1.56] },
};
/** 뚝 떨어지는 맛 */
export const DROP: Ease = {
  o: { x: [0.55], y: [0.06] },
  i: { x: [0.2], y: [1] },
};

/** 키프레임 열 — [프레임, 값, 다음 구간 이징] */
export function an<T extends number[]>(
  frames: Array<[number, T] | [number, T, Ease]>,
) {
  return {
    a: 1 as const,
    k: frames.map(([t, s, ease], index) => {
      const last = index === frames.length - 1;
      const e = ease ?? OUT;
      return last
        ? { t, s }
        : { t, s, i: e.i, o: e.o };
    }),
  };
}

/** 0~255 색을 Lottie가 쓰는 0~1로 */
export function rgb(r: number, g: number, b: number, alpha = 1) {
  return [r / 255, g / 255, b / 255, alpha];
}

type Shape = Record<string, unknown>;

export function ellipse(size: [number, number], pos: [number, number] = [0, 0]) {
  return { ty: "el", p: st(pos), s: st(size), d: 1 };
}

export function rect(
  size: [number, number],
  radius = 0,
  pos: [number, number] = [0, 0],
) {
  return { ty: "rc", p: st(pos), s: st(size), r: st(radius), d: 1 };
}

/** 꼭짓점 목록으로 만드는 자유 곡선. 핸들을 안 주면 직선이 된다 */
export function poly(
  points: Array<[number, number]>,
  closed = true,
  handles?: Array<[[number, number], [number, number]]>,
) {
  return {
    ty: "sh",
    ks: st({
      i: points.map((_, index) => handles?.[index]?.[0] ?? [0, 0]),
      o: points.map((_, index) => handles?.[index]?.[1] ?? [0, 0]),
      v: points,
      c: closed,
    }),
  };
}

export function fill(color: number[], opacity: number | object = 100) {
  return {
    ty: "fl",
    c: st(color),
    o: typeof opacity === "number" ? st(opacity) : opacity,
    r: 1,
  };
}

export function stroke(
  color: number[],
  width: number,
  opacity: number | object = 100,
) {
  return {
    ty: "st",
    c: st(color),
    o: typeof opacity === "number" ? st(opacity) : opacity,
    w: st(width),
    lc: 2,
    lj: 2,
  };
}

/** 선이 그려지는 연출. start/end를 움직이면 획이 자란다 */
export function trim(start: object, end: object) {
  return { ty: "tm", s: start, e: end, o: st(0), m: 1 };
}

/** 그룹 내부 변환 */
export function tr(options: {
  p?: object;
  a?: [number, number];
  s?: object;
  r?: object;
  o?: object;
} = {}) {
  return {
    ty: "tr",
    p: options.p ?? st([0, 0]),
    a: st(options.a ?? [0, 0]),
    s: options.s ?? st([100, 100]),
    r: options.r ?? st(0),
    o: options.o ?? st(100),
    sk: st(0),
    sa: st(0),
  };
}

export function group(items: Shape[]) {
  return { ty: "gr", it: [...items, tr()], nm: "g" };
}

let seq = 0;

/** 도형 레이어 하나 */
export function layer(options: {
  shapes: Shape[];
  p?: object;
  a?: Num3;
  s?: object;
  r?: object;
  o?: object;
  ip?: number;
  op?: number;
  name?: string;
}) {
  seq += 1;
  return {
    ddd: 0,
    ind: seq,
    ty: 4,
    nm: options.name ?? `l${seq}`,
    sr: 1,
    ks: {
      o: options.o ?? st(100),
      r: options.r ?? st(0),
      p: options.p ?? st([0, 0, 0]),
      a: st(options.a ?? [0, 0, 0]),
      s: options.s ?? st([100, 100, 100]),
    },
    ao: 0,
    shapes: options.shapes,
    ip: options.ip ?? 0,
    op: options.op ?? 480,
    st: 0,
    bm: 0,
  };
}

/** 완성된 Lottie 문서 */
export function scene(options: {
  w: number;
  h: number;
  frames: number;
  layers: object[];
  name: string;
}) {
  seq = 0;
  return {
    v: "5.7.4",
    fr: 60,
    ip: 0,
    op: options.frames,
    w: options.w,
    h: options.h,
    nm: options.name,
    ddd: 0,
    assets: [],
    layers: options.layers,
  };
}
