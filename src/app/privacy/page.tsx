import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "개인정보 수집 및 이용 안내",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen pt-24">
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-500">Privacy</p>
        <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
          개인정보처리방침
        </h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-zinc-400">
          <p>
            본 사이트는 서비스 운영, 문의 응대, 접속 통계 분석을 위해 필요한
            최소한의 정보를 처리할 수 있습니다.
          </p>
          <section>
            <h2 className="text-lg font-bold text-white">수집 항목</h2>
            <p className="mt-2">
              문의 시 제공되는 이메일 주소, 이름, 문의 내용 및 접속 로그 등
              서비스 운영에 필요한 정보가 포함될 수 있습니다.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">광고 및 분석 도구</h2>
            <p className="mt-2">
              Google AdSense와 Google Analytics를 사용할 수 있으며, 실제 적용 전
              관련 고지와 동의 절차를 운영 환경에 맞게 보완해야 합니다.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
