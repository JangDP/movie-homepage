import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문의",
  description: "제휴, 보도자료, 광고 문의 안내",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen pt-24">
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-500">Contact</p>
        <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">문의</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-lg font-bold text-white">제휴 및 광고</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              브랜드 캠페인, 배너 광고, 콘텐츠 협업 문의를 받습니다.
            </p>
            <a href="mailto:ads@example.com" className="mt-5 inline-flex text-sm font-bold text-red-500 hover:text-red-400">
              ads@example.com
            </a>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-lg font-bold text-white">보도자료</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              영화 개봉, 행사, 인터뷰 제안 등 편집부 검토가 필요한 자료를 보내주세요.
            </p>
            <a href="mailto:editor@example.com" className="mt-5 inline-flex text-sm font-bold text-red-500 hover:text-red-400">
              editor@example.com
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
