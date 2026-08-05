"use client";

const KEY = "wigtn-demo-inquiries-v1";

export type DemoInquiry = {
  id: string;
  category: string;
  message: string;
  at: string;
};

export function loadDemoInquiries(): DemoInquiry[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as DemoInquiry[]) : [];
  } catch {
    window.localStorage.removeItem(KEY);
    return [];
  }
}

export function saveDemoInquiry(inquiry: DemoInquiry) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    KEY,
    JSON.stringify([inquiry, ...loadDemoInquiries()].slice(0, 5)),
  );
}
