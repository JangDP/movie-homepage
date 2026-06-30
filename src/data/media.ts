import type { CmsMediaAsset } from "@/types/cms";

export const mediaAssets: CmsMediaAsset[] = [
  {
    id: "media-hero-theater",
    title: "어두운 영화관 메인 배너",
    url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    alt: "어두운 영화관 좌석과 스크린",
    type: "image",
    usage: ["banner", "background"],
    createdAt: "2026-06-28",
  },
  {
    id: "media-popcorn",
    title: "팝콘과 영화 티켓",
    url: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1200&q=80",
    alt: "팝콘과 영화 티켓",
    type: "image",
    usage: ["thumbnail", "body"],
    createdAt: "2026-06-25",
  },
  {
    id: "media-camera",
    title: "촬영 장비",
    url: "https://images.unsplash.com/photo-1596727147705-61a532a659bd?auto=format&fit=crop&w=1200&q=80",
    alt: "카메라 렌즈와 촬영 장비",
    type: "image",
    usage: ["thumbnail", "body"],
    createdAt: "2026-06-24",
  },
  {
    id: "media-tv",
    title: "OTT 거실 화면",
    url: "https://images.unsplash.com/photo-1586899028174-e7098604235b?auto=format&fit=crop&w=1200&q=80",
    alt: "TV 화면 앞 리모컨",
    type: "image",
    usage: ["thumbnail", "body"],
    createdAt: "2026-06-22",
  },
  {
    id: "media-logo",
    title: "CineScope 로고용 배경",
    url: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1200&q=80",
    alt: "영화 필름과 붉은 조명",
    type: "image",
    usage: ["logo", "thumbnail"],
    createdAt: "2026-06-20",
  },
];
