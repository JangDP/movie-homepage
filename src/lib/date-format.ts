export function parseDateValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatPostDate(value?: string | null) {
  const date = parseDateValue(value);

  if (!date) {
    return value || "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatRelativeTime(value?: string | null) {
  const date = parseDateValue(value);

  if (!date) {
    return "";
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const month = day * 30;
  const year = day * 365;

  if (diffSeconds < minute) {
    return "방금 전";
  }

  if (diffSeconds < hour) {
    return `${Math.floor(diffSeconds / minute)}분 전`;
  }

  if (diffSeconds < day) {
    return `${Math.floor(diffSeconds / hour)}시간 전`;
  }

  if (diffSeconds < month) {
    return `${Math.floor(diffSeconds / day)}일 전`;
  }

  if (diffSeconds < year) {
    return `${Math.floor(diffSeconds / month)}개월 전`;
  }

  return `${Math.floor(diffSeconds / year)}년 전`;
}
