"use client";

import { useState } from "react";
import { Select } from "@/components/ds/Select";
import { Icon } from "@/components/Icon";
import { Overlay } from "./Overlay";

/**
 * 입력 폼 모달 — 등록·수정처럼 id만으로 부족한 조치가 값을 받는 자리.
 * 시안엔 없던 화면이라 `.modal` 체계만 따르고 스타일은 app/globals.css에 뒀다.
 */

export type Field = {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  textarea?: boolean;
  options?: string[];
  /**
   * options를 세그먼트 버튼 대신 드롭다운으로 그린다 — 실재 목록에서 고르는
   * 긴 선택지(큐레이션 추천 회사·고정 글)용. 자유 입력을 막아 "저장은 됐는데
   * 홈에서 조용히 탈락"하는 미매칭을 원천 차단한다.
   */
  select?: boolean;
};

export function FormModal({
  title,
  sub,
  fields,
  initial,
  submitLabel,
  busy,
  preview,
  onCancel,
  onSubmit,
}: {
  title: string;
  sub?: string;
  fields: Field[];
  initial?: Record<string, string>;
  submitLabel: string;
  busy?: boolean;
  /**
   * 현재 입력값 미리보기 — 선택 결과가 화면에서 어떻게 보일지(큐레이션의
   * 회사 로고 등) 제출 전에 확인시킬 때만 넘긴다. null이면 그리지 않는다.
   */
  preview?: (values: Record<string, string>) => React.ReactNode;
  onCancel: () => void;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, initial?.[f.key] ?? ""])),
  );
  const [error, setError] = useState<string | null>(null);

  return (
    <Overlay onClose={onCancel}>
      <form
        className="modal form"
        onSubmit={(event) => {
          event.preventDefault();
          const missing = fields.find(
            (field) => field.required && !values[field.key]?.trim(),
          );
          if (missing) {
            setError(`${missing.label}을(를) 입력해주세요.`);
            return;
          }
          setError(null);
          onSubmit(values);
        }}
      >
        <h3>{title}</h3>
        {sub ? <div className="msub">{sub}</div> : null}

        {fields.map((field) => (
          <div className="field" key={field.key}>
            <label>
              {field.label}
              {field.required ? <span className="req">*</span> : null}
            </label>
            {field.textarea ? (
              <textarea
                className="in"
                value={values[field.key]}
                placeholder={field.placeholder}
                onChange={(event) =>
                  setValues({ ...values, [field.key]: event.target.value })
                }
              />
            ) : field.options && field.select ? (
              <Select
                value={values[field.key]}
                onChange={(next) => setValues({ ...values, [field.key]: next })}
                options={field.options.map((option) => ({
                  value: option,
                  label: option,
                }))}
                placeholder={field.placeholder ?? "선택하세요"}
                ariaLabel={field.label}
              />
            ) : field.options ? (
              <div className="seg2" style={{ display: "inline-flex" }}>
                {field.options.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={values[field.key] === option ? "on" : undefined}
                    onClick={() =>
                      setValues({ ...values, [field.key]: option })
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <input
                className="in"
                value={values[field.key]}
                placeholder={field.placeholder}
                onChange={(event) =>
                  setValues({ ...values, [field.key]: event.target.value })
                }
              />
            )}
          </div>
        ))}

        {preview ? preview(values) : null}

        {error ? (
          <div className="safenote warn" style={{ marginBottom: 0 }}>
            <span className="si">
              <Icon name="alert" />
            </span>
            <div>
              <b>{error}</b>
            </div>
          </div>
        ) : null}

        <div className="facts">
          <button type="button" className="btn line" onClick={onCancel}>
            취소
          </button>
          <button className="btn primary" type="submit" disabled={busy}>
            {submitLabel}
          </button>
        </div>
      </form>
    </Overlay>
  );
}
