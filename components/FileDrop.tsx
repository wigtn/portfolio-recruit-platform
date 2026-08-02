"use client";

import { useRef, useState } from "react";
import {
  ALLOWED_POST_ATTACHMENT_TYPES,
  MAX_POST_ATTACHMENT_BYTES,
} from "@wigtn/content-engine";
import { Icon } from "./Icon";
import { toast } from "./ds/Toaster";

/**
 * 첨부 업로드 — 실제로 검증한다.
 *
 * 허용 형식·용량 한도는 벤더링한 content-engine의 값을 그대로 쓴다. SVG를 막는 이유까지
 * 문구로 남긴다(USER-FLOW §2.4 3단계) — 막은 것과 살린 것을 함께 보여줘야
 * "다 지워버리는 무식한 필터"로 읽히지 않는다.
 *
 * 파일 자체는 어디에도 올리지 않는다. 이름·크기만 화면에 남는다(r4 — 체험 입력은 서버에 안 간다).
 */

export type Accepted = { name: string; size: number };

const MB = 1024 * 1024;

function reject(file: File): string | null {
  if (file.type === "image/svg+xml") {
    return "SVG는 스크립트를 담을 수 있어 받지 않아요";
  }
  if (!ALLOWED_POST_ATTACHMENT_TYPES.includes(file.type as never)) {
    return `${file.type || "알 수 없는 형식"}은 받지 않아요, JPG, PNG, WebP, PDF만 가능해요`;
  }
  if (file.size > MAX_POST_ATTACHMENT_BYTES) {
    return `${(file.size / MB).toFixed(1)}MB, 한도 ${MAX_POST_ATTACHMENT_BYTES / MB}MB를 넘어요`;
  }
  return null;
}

export function FileDrop({
  files,
  onChange,
  note,
  compact,
}: {
  files: Accepted[];
  onChange: (files: Accepted[]) => void;
  note?: string;
  compact?: boolean;
}) {

  const input = useRef<HTMLInputElement>(null);

  function take(list: FileList | null) {
    if (!list) return;
    const ok: Accepted[] = [];
    const bad: Array<{ name: string; why: string }> = [];
    Array.from(list).forEach((file) => {
      const why = reject(file);
      if (why) bad.push({ name: file.name, why });
      else ok.push({ name: file.name, size: file.size });
    });
    /* 거절은 토스트로 모아서 한 번만 말한다.

       파일마다 배너를 쌓으면 다섯 개를 떨궜을 때 화면이 경고로 덮인다.
       무엇이 왜 빠졌는지는 한 줄이면 되고, 여러 건이면 첫 사유가 대개
       나머지와 같다(용량, 확장자). */
    if (bad.length === 1) {
      toast(`${bad[0].name}는 첨부하지 않았어요. ${bad[0].why}`, {
        tone: "warn",
      });
    } else if (bad.length > 1) {
      toast(`${bad.length}개 파일을 첨부하지 않았어요. ${bad[0].why}`, {
        tone: "warn",
      });
    }
    if (ok.length) onChange([...files, ...ok]);
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          take(event.target.files);
          event.target.value = "";
        }}
      />

      <div
        className="dropzone"
        style={compact ? { padding: 14, margin: 0 } : undefined}
        onClick={() => input.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          take(event.dataTransfer.files);
        }}
      >
        <Icon name="upload" />
        <div>
          <b>이미지를 끌어다 놓거나 클릭해서 업로드</b>
        </div>
        <div className="sub">{note ?? "JPG, PNG, WebP, PDF, 10MB까지"}</div>
      </div>

      {files.length ? (
        <div className="filelist">
          {files.map((file, index) => (
            <div className="fr" key={`${file.name}-${index}`}>
              <Icon name="image" />
              <span className="fn">{file.name}</span>
              <span className="fs">{(file.size / MB).toFixed(1)}MB</span>
              <button
                aria-label={`${file.name} 빼기`}
                onClick={() =>
                  onChange(files.filter((_, item) => item !== index))
                }
              >
                <Icon name="x" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

    </>
  );
}
