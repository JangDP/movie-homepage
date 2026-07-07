import type { SiteConfig } from "@/types/site";

export const siteConfig: SiteConfig = {
  name: "시네마틱 유니버스",
  logoText: "시네마틱 유니버스",
  url: "https://wkdemvnfworld.com",
  description:
    "영화 뉴스, 리뷰, 관람 가이드, OTT 추천을 다루는 다크톤 영화 전문 매거진입니다.",
  menus: [
    { id: "nav-news", label: "뉴스", href: "/news", order: 1 },
    { id: "nav-reviews", label: "리뷰", href: "/reviews", order: 2 },
    { id: "nav-guide", label: "가이드", href: "/guide", order: 3 },
    { id: "nav-recommendations", label: "추천", href: "/recommendations", order: 4 },
    { id: "nav-upcoming", label: "개봉예정", href: "/upcoming", order: 5 },
    { id: "nav-ott", label: "OTT", href: "/ott", order: 6 },
  ],
  categories: [
    {
      id: "news",
      label: "영화 뉴스",
      href: "/news",
      description: "산업 이슈, 캐스팅, 제작 소식, 박스오피스 흐름을 빠르게 전합니다.",
      order: 1,
      visible: true,
    },
    {
      id: "reviews",
      label: "리뷰",
      href: "/reviews",
      description: "신작과 화제작을 장면, 연기, 연출, 사운드 관점에서 분석합니다.",
      order: 2,
      visible: true,
    },
    {
      id: "guide",
      label: "관람 가이드",
      href: "/guide",
      description: "영화를 더 깊게 즐기기 위한 입문 가이드와 해설을 제공합니다.",
      order: 3,
      visible: true,
    },
    {
      id: "recommendations",
      label: "추천",
      href: "/recommendations",
      description: "기분, 장르, 시즌에 맞춘 영화 큐레이션을 소개합니다.",
      order: 4,
      visible: true,
    },
    {
      id: "upcoming",
      label: "개봉예정",
      href: "/upcoming",
      description: "극장 개봉과 영화제 상영 예정작을 미리 살펴봅니다.",
      order: 5,
      visible: true,
    },
    {
      id: "ott",
      label: "OTT",
      href: "/ott",
      description: "넷플릭스, 디즈니+, 웨이브, 티빙 등 스트리밍 신작을 정리합니다.",
      order: 6,
      visible: true,
    },
  ],
  hero: {
    eyebrow: "This Week's Focus",
    title: "극장과 OTT 사이, 지금 봐야 할 영화의 흐름",
    description:
      "신작 뉴스부터 깊이 있는 리뷰, 주말 추천작까지 한 화면에서 빠르게 훑어보세요.",
    primaryCta: { label: "최신 리뷰 보기", href: "/reviews" },
    secondaryCta: { label: "OTT 추천 보기", href: "/ott" },
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "어두운 영화관 좌석과 스크린",
  },
  appearance: {
    logoText: "시네마틱 유니버스",
    heroImage:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1800&q=80",
    backgroundImage:
      "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1800&q=80",
    accentColor: "#b91c1c",
    cardStyle: "editorial",
    visibleSections: {
      featured: true,
      movies: true,
      latest: true,
      categories: true,
    },
    footerText: "시네마틱 유니버스는 영화를 좋아하는 독자를 위한 뉴스, 리뷰, 추천 중심의 매거진입니다.",
  },
  socialLinks: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "YouTube", href: "https://youtube.com" },
    { label: "X", href: "https://x.com" },
  ],
  footer: {
    description:
      "시네마틱 유니버스는 영화를 좋아하는 독자를 위한 뉴스, 리뷰, 추천 중심의 매거진입니다.",
    copyright: "© 2026 시네마틱 유니버스. All rights reserved.",
    links: [
      { label: "소개", href: "/about" },
      { label: "문의", href: "/contact" },
      { label: "개인정보처리방침", href: "/privacy" },
    ],
  },
};
