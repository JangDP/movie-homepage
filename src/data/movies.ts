import type { Movie } from "@/types/site";

export const movies: Movie[] = [
  {
    id: "m-001",
    title: "레드 커튼",
    originalTitle: "Red Curtain",
    genre: ["미스터리", "스릴러"],
    rating: 8.4,
    releaseLabel: "극장 상영중",
    poster:
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=900&q=80",
    posterAlt: "영화 필름과 붉은 조명",
    summary: "폐관을 앞둔 극장에서 벌어지는 마지막 상영의 미스터리.",
    source: "theater",
  },
  {
    id: "m-002",
    title: "새벽의 궤도",
    originalTitle: "Orbit at Dawn",
    genre: ["SF", "드라마"],
    rating: 8.8,
    releaseLabel: "7월 개봉",
    poster:
      "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=900&q=80",
    posterAlt: "우주와 별",
    summary: "고립된 우주정거장에서 지구의 마지막 신호를 기다리는 사람들.",
    source: "festival",
  },
  {
    id: "m-003",
    title: "블루 노트 클럽",
    originalTitle: "Blue Note Club",
    genre: ["음악", "로맨스"],
    rating: 7.9,
    releaseLabel: "OTT 공개",
    poster:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
    posterAlt: "무대 위 마이크",
    summary: "재즈 클럽에서 다시 만난 두 뮤지션의 늦은 고백.",
    source: "ott",
  },
  {
    id: "m-004",
    title: "마지막 테이크",
    originalTitle: "The Final Take",
    genre: ["드라마", "블랙코미디"],
    rating: 8.1,
    releaseLabel: "프리미어",
    poster:
      "https://images.unsplash.com/photo-1500213152680-0eea4226b3b8?auto=format&fit=crop&w=900&q=80",
    posterAlt: "영화 카메라 실루엣",
    summary: "망한 영화의 재촬영 현장에서 시작되는 예측 불가한 하루.",
    source: "theater",
  },
];
