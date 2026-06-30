import Link from "next/link";

import { siteConfig } from "@/data/site-config";

export function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-black">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <Link href="/" className="text-xl font-black text-white">
            {siteConfig.logoText}
          </Link>
          <p className="max-w-md text-sm leading-6 text-zinc-500">
            {siteConfig.appearance.footerText}
          </p>
          <p className="text-xs text-zinc-600">{siteConfig.footer.copyright}</p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-zinc-200">Sections</h2>
          <div className="mt-4 grid gap-2">
            {siteConfig.menus.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-zinc-500 hover:text-red-500"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold text-zinc-200">Info</h2>
          <div className="mt-4 grid gap-2">
            {siteConfig.footer.links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-zinc-500 hover:text-red-500"
              >
                {item.label}
              </Link>
            ))}
            {siteConfig.socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-zinc-500 hover:text-red-500"
                target="_blank"
                rel="noreferrer"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
