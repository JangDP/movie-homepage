import type { Metadata } from "next";

import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: "소개",
  description: `${siteConfig.name} 소개`,
};

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-24">
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-500">About</p>
        <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
          영화를 더 선명하게 읽는 매거진
        </h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-zinc-400 sm:text-base">
          <p>
            {siteConfig.name}은 영화 뉴스, 리뷰, 관람 가이드, 추천 큐레이션을
            운영하는 전문 매거진입니다. 극장 개봉작과 OTT 신작을 함께 다루며,
            독자가 오늘 볼 작품과 오래 기억할 작품을 고를 수 있도록 돕습니다.
          </p>
          <p>
            이후 관리자 페이지에서는 메뉴, 카테고리, 배너, 사이트 이미지, 글을
            직접 관리할 수 있도록 현재 설정과 콘텐츠 데이터를 분리된 구조로
            설계했습니다.
          </p>
        </div>
      </section>
    </main>
  );
}
