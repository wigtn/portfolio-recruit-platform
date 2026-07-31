import {
  an,
  DROP,
  ellipse,
  fill,
  group,
  IO,
  layer,
  OUT,
  poly,
  POP,
  rect,
  rgb,
  scene,
  st,
  stroke,
  tr,
  trim,
} from "./kit";

/**
 * 모듈 장면 넷.
 *
 * 고객은 모듈이 어떻게 도는지 궁금하지 않다. 그래서 구조도를 그리지 않고
 * 비유로 간다. 블록을 쌓고, 문을 열고, 얼룩을 지우고, 편지를 보낸다.
 * 설명 없이 3초 안에 무슨 뜻인지 읽히는 것만 남겼다.
 *
 * 화면 크기는 420x236으로 통일한다. 8초에 한 바퀴(480프레임)라 네 장면이
 * 나란히 놓여도 호흡이 맞는다.
 */

const W = 420;
const H = 236;
const F = 480;

const INK = rgb(30, 33, 45);
const SOFT = rgb(228, 231, 240);
const PAPER = rgb(255, 255, 255);

/** 쌓아도 무너지지 않는다 */
export function blocksScene(tint: [number, number, number]) {
  const color = rgb(...tint);
  const shade = rgb(
    Math.round(tint[0] * 0.82),
    Math.round(tint[1] * 0.82),
    Math.round(tint[2] * 0.86),
  );

  // 블록 셋이 차례로 떨어져 자리를 잡는다. 마지막에 한 번 흔들려도 그대로다
  const block = (index: number, width: number, y: number, at: number) =>
    layer({
      name: `block${index}`,
      // 칸 사이가 벌어져야 "쌓았다"로 읽힌다. 붙여 놓으면 한 덩어리로 보인다
      shapes: [group([rect([width, 26], 9), fill(index === 1 ? shade : color)])],
      p: an([
        [at, [210, y - 130, 0], DROP],
        [at + 26, [210, y + 8, 0], POP],
        [at + 44, [210, y, 0]],
        [340, [210, y, 0], IO],
        [356, [210 + (index % 2 ? -5 : 5), y, 0], IO],
        [376, [210 + (index % 2 ? 4 : -4), y, 0], IO],
        [396, [210, y, 0]],
      ]),
      o: an([
        [at, [0]],
        [at + 8, [100]],
      ]),
      s: an([
        [at + 26, [112, 82, 100], POP],
        [at + 46, [100, 100, 100]],
      ]),
    });

  return scene({
    w: W,
    h: H,
    frames: F,
    name: "blocks",
    layers: [
      // 바닥 그림자
      layer({
        name: "shadow",
        shapes: [
          group([
            ellipse([146, 13], [0, 0]),
            fill(SOFT, an([[0, [0]], [120, [70]]])),
          ]),
        ],
        p: st([210, 180, 0]),
      }),
      block(3, 128, 158, 200),
      block(2, 104, 122, 110),
      block(1, 78, 86, 20),
      // 다 쌓이면 위에 부드러운 확인 표시
      layer({
        name: "tick",
        shapes: [
          group([
            poly([[-9, 1], [-2, 9], [11, -8]], false),
            stroke(color, 5),
            trim(st(0), an([[268, [0]], [300, [100], OUT]])),
          ]),
        ],
        p: st([210, 46, 0]),
        o: an([
          [260, [0]],
          [280, [100]],
          [430, [100], IO],
          [460, [0]],
        ]),
        s: an([
          [268, [70, 70, 100], POP],
          [292, [100, 100, 100]],
        ]),
      }),
    ],
  });
}

/** 열쇠가 돌고 문이 열린다 */
export function doorScene(tint: [number, number, number]) {
  const color = rgb(...tint);
  const glow = rgb(
    Math.min(255, tint[0] + 40),
    Math.min(255, tint[1] + 30),
    255,
  );

  return scene({
    w: W,
    h: H,
    frames: F,
    name: "door",
    layers: [
      // 문 뒤에서 번지는 빛
      layer({
        name: "glow",
        shapes: [group([ellipse([220, 220]), fill(glow, st(38))])],
        p: st([210, 118, 0]),
        o: an([
          [0, [0]],
          [230, [0], OUT],
          [300, [100], IO],
          [430, [100], IO],
          [470, [0]],
        ]),
        s: an([
          [230, [40, 40, 100], OUT],
          [320, [116, 116, 100], IO],
          [430, [104, 104, 100]],
        ]),
      }),
      // 문틀
      layer({
        name: "frame",
        shapes: [
          group([rect([132, 172], 18), stroke(SOFT, 6)]),
        ],
        p: st([210, 118, 0]),
      }),
      // 문짝. 왼쪽 경첩을 축으로 열린다
      layer({
        name: "door",
        shapes: [
          group([
            rect([120, 160], 14, [60, 0]),
            fill(color),
            // 손잡이
          ]),
          group([ellipse([13, 13], [104, 0]), fill(PAPER, st(85))]),
        ],
        p: st([150, 118, 0]),
        s: an([
          [0, [100, 100, 100], IO],
          [230, [100, 100, 100], IO],
          [310, [22, 100, 100], IO],
          [430, [22, 100, 100], IO],
          [470, [100, 100, 100]],
        ]),
      }),
      // 열쇠가 다가와 돈다
      layer({
        name: "key",
        shapes: [
          group([ellipse([26, 26]), stroke(color, 6)]),
          group([rect([34, 6], 3, [26, 0]), fill(color)]),
          group([rect([6, 12], 3, [36, 6]), fill(color)]),
        ],
        p: an([
          [60, [330, 118, 0], OUT],
          [150, [252, 118, 0], IO],
          [250, [252, 118, 0], OUT],
          [300, [330, 118, 0]],
        ]),
        r: an([
          [150, [0], IO],
          [230, [95]],
        ]),
        o: an([
          [50, [0]],
          [80, [100], IO],
          [270, [100], OUT],
          [300, [0]],
        ]),
      }),
    ],
  });
}

/** 얼룩을 지운다 */
export function cleanScene(tint: [number, number, number]) {
  const color = rgb(...tint);
  const stain = rgb(232, 92, 96);

  const line = (y: number, width: number, at: number) =>
    layer({
      name: `line${y}`,
      shapes: [
        group([
          rect([width, 10], 5, [width / 2, 0]),
          fill(SOFT),
        ]),
      ],
      p: st([124, y, 0]),
      s: an([
        [at, [0, 100, 100], OUT],
        [at + 40, [100, 100, 100]],
      ]),
    });

  return scene({
    w: W,
    h: H,
    frames: F,
    name: "clean",
    layers: [
      // 종이
      layer({
        name: "paper",
        shapes: [group([rect([236, 168], 16), fill(PAPER), stroke(SOFT, 3)])],
        p: st([210, 112, 0]),
        s: an([
          [0, [92, 92, 100], POP],
          [26, [100, 100, 100]],
        ]),
      }),
      line(70, 168, 20),
      line(104, 140, 44),
      line(170, 120, 96),
      // 얼룩진 줄
      layer({
        name: "stain",
        shapes: [group([rect([92, 12], 6, [46, 0]), fill(stain, st(88))])],
        p: st([124, 137, 0]),
        o: an([
          [80, [0]],
          [104, [100], IO],
          [250, [100], OUT],
          [286, [0]],
        ]),
        s: an([
          [104, [70, 130, 100], POP],
          [126, [100, 100, 100], IO],
          [250, [100, 100, 100], IO],
          [286, [100, 40, 100]],
        ]),
      }),
      // 깨끗해진 줄
      layer({
        name: "fixed",
        shapes: [group([rect([92, 10], 5, [46, 0]), fill(color, st(80))])],
        p: st([124, 137, 0]),
        o: an([
          [0, [0]],
          [270, [0], OUT],
          [300, [100], IO],
          [440, [100], IO],
          [470, [0]],
        ]),
        s: an([
          [270, [40, 100, 100], POP],
          [312, [100, 100, 100]],
        ]),
      }),
      // 훑고 지나가는 손길
      layer({
        name: "wipe",
        shapes: [group([ellipse([54, 54]), fill(color, st(16))])],
        p: an([
          [190, [86, 137, 0], IO],
          [280, [330, 137, 0]],
        ]),
        o: an([
          [180, [0]],
          [200, [100], IO],
          [262, [100], OUT],
          [292, [0]],
        ]),
      }),
      // 반짝
      layer({
        name: "spark",
        shapes: [
          group([poly([[0, -11], [3, -3], [11, 0], [3, 3], [0, 11], [-3, 3], [-11, 0], [-3, -3]]), fill(color)]),
        ],
        p: st([300, 96, 0]),
        o: an([
          [292, [0]],
          [312, [100], IO],
          [400, [100], OUT],
          [430, [0]],
        ]),
        s: an([
          [292, [0, 0, 100], POP],
          [326, [100, 100, 100], IO],
          [400, [86, 86, 100]],
        ]),
        r: an([
          [292, [-30], OUT],
          [400, [20]],
        ]),
      }),
    ],
  });
}

/** 편지가 날아가 도착한다 */
export function letterScene(tint: [number, number, number]) {
  const color = rgb(...tint);

  return scene({
    w: W,
    h: H,
    frames: F,
    name: "letter",
    layers: [
      // 날아간 자취
      layer({
        name: "trail",
        shapes: [
          group([
            poly(
              [
                [-140, 40],
                [-30, -34],
                [80, 26],
                [148, -30],
              ],
              false,
              [
                [[0, 0], [40, -30]],
                [[-40, 20], [40, -20]],
                [[-40, -22], [36, 22]],
                [[-30, 24], [0, 0]],
              ],
            ),
            stroke(color, 3, st(38)),
            trim(
              an([
                [0, [0], IO],
                [200, [0], IO],
                [330, [72]],
              ]),
              an([
                [0, [0], IO],
                [40, [0], IO],
                [230, [100]],
              ]),
            ),
          ]),
        ],
        p: st([210, 116, 0]),
      }),
      // 편지
      layer({
        name: "plane",
        shapes: [
          group([
            poly([[-16, -12], [18, 0], [-16, 12], [-9, 0]]),
            fill(color),
          ]),
          group([poly([[-16, -12], [-9, 0], [-16, 12]], true), fill(color, st(62))]),
        ],
        p: an([
          [30, [70, 156, 0], IO],
          [130, [180, 82, 0], IO],
          [230, [290, 142, 0], IO],
          [300, [358, 86, 0]],
        ]),
        r: an([
          [30, [-22], IO],
          [130, [16], IO],
          [230, [-18], IO],
          [300, [-10]],
        ]),
        o: an([
          [24, [0]],
          [46, [100], IO],
          [286, [100], OUT],
          [306, [0]],
        ]),
        s: an([
          [30, [86, 86, 100], IO],
          [160, [104, 104, 100], IO],
          [300, [80, 80, 100]],
        ]),
      }),
      // 도착한 자리
      layer({
        name: "inbox",
        shapes: [
          group([ellipse([54, 54]), fill(color, st(14))]),
          group([ellipse([34, 34]), fill(color)]),
        ],
        p: st([364, 84, 0]),
        s: an([
          [0, [0, 0, 100], OUT],
          [296, [0, 0, 100], POP],
          [330, [112, 112, 100], IO],
          [352, [100, 100, 100], IO],
          [440, [100, 100, 100], OUT],
          [470, [0, 0, 100]],
        ]),
      }),
      // 도착 파문
      layer({
        name: "ripple",
        shapes: [group([ellipse([54, 54]), stroke(color, 3)])],
        p: st([364, 84, 0]),
        o: an([
          [300, [0]],
          [316, [72], OUT],
          [386, [0]],
        ]),
        s: an([
          [300, [60, 60, 100], OUT],
          [386, [190, 190, 100]],
        ]),
      }),
    ],
  });
}

/** 모듈 id에 물린 장면 */
export const MODULE_SCENES: Record<string, () => object> = {
  "api-contracts": () => blocksScene([56, 132, 224]),
  "auth-membership": () => doorScene([124, 92, 240]),
  "ai-pipeline-sdk": () => cleanScene([150, 88, 226]),
  "notification-file": () => letterScene([226, 78, 128]),
};
