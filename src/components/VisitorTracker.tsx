"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { getVisitorId } from "@/lib/visitor";
import { isLikelyBot, shouldTrackPath, trackSiteVisit } from "@/lib/visitor-stats";

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !shouldTrackPath(pathname)) {
      return;
    }

    if (typeof window !== "undefined" && isLikelyBot(window.navigator.userAgent)) {
      return;
    }

    const visitorId = getVisitorId();

    if (!visitorId) {
      return;
    }

    void trackSiteVisit({ visitorId, pathname });
  }, [pathname]);

  return null;
}
