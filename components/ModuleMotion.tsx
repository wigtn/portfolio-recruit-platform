"use client";

import { useMemo } from "react";
import { LottieScene } from "./LottieScene";
import {
  blocksScene,
  cleanScene,
  doorScene,
  letterScene,
} from "@/lib/lottie/scenes";

/**
 * 기능 모듈 장면.
 *
 * 처음에는 이벤트가 게이트를 지나고 봉투가 검사받는 그림을 그렸다. 만들고 보니
 * 그건 개발자한테나 읽히는 도식이었다. 상담 페이지에 오는 사람은 모듈이 어떻게
 * 도는지 궁금해서 온 게 아니다.
 *
 * 그래서 비유로 바꿨다. 블록을 쌓고, 문을 열고, 얼룩을 지우고, 편지를 보낸다.
 * 설명을 읽지 않아도 3초 안에 무슨 뜻인지 잡히는 것만 남겼다.
 *
 * 장면은 Lottie로 만든다. CSS로 짜면 도형 하나 옮길 때마다 선택자를 새로
 * 만들어야 해서 타이밍을 다듬을수록 코드가 무너진다. Lottie는 키프레임이
 * 데이터라 움직임만 고치면 된다.
 */

export function ContractsMotion() {
  const data = useMemo(() => blocksScene([56, 132, 224]), []);
  return (
    <figure className="mot">
      <LottieScene
        data={data}
        label="블록을 하나씩 쌓아 올리고 흔들어도 무너지지 않는 장면"
      />
      <figcaption className="mot-cap">
        기능을 덧붙여도 기존 화면이 영향을 받지 않습니다.
      </figcaption>
    </figure>
  );
}

export function AuthMotion() {
  const data = useMemo(() => doorScene([124, 92, 240]), []);
  return (
    <figure className="mot">
      <LottieScene
        data={data}
        label="열쇠가 돌아가고 문이 열리며 안쪽이 환해지는 장면"
      />
      <figcaption className="mot-cap">
        회원에게만 열리는 영역이 있어야 가입할 이유가 생깁니다.
      </figcaption>
    </figure>
  );
}

export function AiMotion() {
  const data = useMemo(() => cleanScene([150, 88, 226]), []);
  return (
    <figure className="mot">
      <LottieScene
        data={data}
        label="종이에 번진 얼룩을 훑고 지나가 깨끗하게 지우는 장면"
      />
      <figcaption className="mot-cap">
        AI가 잘못 쓴 문장은 공개되기 전에 걸러집니다.
      </figcaption>
    </figure>
  );
}

export function NotifyMotion() {
  const data = useMemo(() => letterScene([226, 78, 128]), []);
  return (
    <figure className="mot">
      <LottieScene
        data={data}
        label="편지가 곡선을 그리며 날아가 상대에게 도착하는 장면"
      />
      <figcaption className="mot-cap">
        처리 결과가 전달되므로 같은 문의가 반복되지 않습니다.
      </figcaption>
    </figure>
  );
}
