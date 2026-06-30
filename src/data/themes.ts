import type { CmsTheme } from "@/types/cms";

export const themes: CmsTheme[] = [
  {
    id: "cinema",
    name: "Cinema",
    description: "극장 조명과 붉은 포인트가 강한 기본 영화 매거진 테마",
    accentColor: "#b91c1c",
    previewClassName: "from-red-950 via-zinc-950 to-black",
  },
  {
    id: "netflix",
    name: "Netflix",
    description: "강한 레드 CTA와 큰 썸네일 중심의 스트리밍 감성",
    accentColor: "#e50914",
    previewClassName: "from-red-900 via-black to-zinc-950",
  },
  {
    id: "imdb",
    name: "IMDb",
    description: "노란 포인트와 정보 밀도가 높은 영화 데이터베이스 감성",
    accentColor: "#f5c518",
    previewClassName: "from-yellow-700 via-zinc-950 to-black",
  },
  {
    id: "letterboxd",
    name: "Letterboxd",
    description: "초록 포인트와 리뷰 커뮤니티 느낌의 카드형 테마",
    accentColor: "#00c030",
    previewClassName: "from-emerald-900 via-zinc-950 to-black",
  },
  {
    id: "magazine",
    name: "Magazine",
    description: "큰 제목, 넓은 여백, 에디토리얼 레이아웃에 어울리는 테마",
    accentColor: "#dc2626",
    previewClassName: "from-zinc-800 via-black to-red-950",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "장식은 줄이고 글 읽기에 집중하는 미니멀 테마",
    accentColor: "#a1a1aa",
    previewClassName: "from-zinc-700 via-zinc-950 to-black",
  },
];
