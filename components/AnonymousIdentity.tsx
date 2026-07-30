import { Icon } from "./Icon";

export function AnonymousIdentity({ verified = false }: { verified?: boolean }) {
  return (
    <span className="anonymous-identity">
      <span>익명</span>
      {verified ? (
        <span className="anonymous-verified" aria-label="재직 인증 완료">
          <Icon name="award" />
          인증
        </span>
      ) : null}
    </span>
  );
}
