"use client";

import { useEffect, useState } from "react";
import { loadUser, saveUser, toggleIn } from "@/lib/demo/user";
import { Icon } from "./Icon";

/** 회사 팔로우 — 이 브라우저에만 남는다 */
export function FollowButton({ slug }: { slug: string }) {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOn(loadUser().follows.includes(slug));
    setReady(true);
  }, [slug]);

  return (
    <button
      className={on ? "btn primary sm" : "btn line sm"}
      disabled={!ready}
      onClick={() => {
        const user = loadUser();
        const next = { ...user, follows: toggleIn(user.follows, slug) };
        saveUser(next);
        setOn(next.follows.includes(slug));
      }}
    >
      <Icon name={on ? "check" : "plus"} /> {on ? "팔로잉" : "팔로우"}
    </button>
  );
}
