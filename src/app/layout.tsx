import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { siteConfig } from "@/data/site-config";
import { absoluteUrl, siteUrl } from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["영화", "영화 뉴스", "영화 리뷰", "OTT 추천", "개봉 예정", "CineScope"],
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": absoluteUrl("/rss.xml"),
    },
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteUrl,
    siteName: siteConfig.name,
    locale: "ko_KR",
    type: "website",
    images: [siteConfig.appearance.heroImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.appearance.heroImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bodyStyle = {
    "--accent-color": siteConfig.appearance.accentColor,
    "--site-background-image": `url(${siteConfig.appearance.backgroundImage})`,
  } as CSSProperties;

  return (
    <html lang="ko">
      <body style={bodyStyle}>
        <Header />
        {children}
        <Footer />
        <Analytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      </body>
    </html>
  );
}
