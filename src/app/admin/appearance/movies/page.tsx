import type { Metadata } from "next";

import { AdminMovieCardsManager } from "@/components/AdminMovieCardsManager";
import { AdminShell } from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "영화 카드 관리",
  robots: { index: false, follow: false },
};

export default function AdminMovieCardsPage() {
  return (
    <AdminShell
      title="영화 카드 관리"
      description="홈페이지 영화 카드의 포스터, 제목, 상태 라벨, 평점, 장르, 소개 문구를 수정합니다."
    >
      <AdminMovieCardsManager />
    </AdminShell>
  );
}
