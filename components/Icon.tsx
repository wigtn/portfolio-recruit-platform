/**
 * 아이콘 — 시안 마크업의 `<svg class="ic ico"><use href="#i-xxx"/></svg>`를 감싼다.
 * `ic`는 stroke 계열, `icf`는 fill 계열(별 등)이다.
 */
export function Icon({
  name,
  filled,
  className,
  style,
}: {
  name: string;
  filled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const base = filled ? "icf" : "ic ico";
  return (
    <svg className={className ? `${base} ${className}` : base} style={style}>
      <use href={`#i-${name}`} />
    </svg>
  );
}
