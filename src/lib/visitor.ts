const VISITOR_ID_KEY = "cinescope_visitor_id";

function createFallbackId() {
  return `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function getVisitorId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(VISITOR_ID_KEY);

  if (existing) {
    return existing;
  }

  const created =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : createFallbackId();

  window.localStorage.setItem(VISITOR_ID_KEY, created);
  return created;
}

