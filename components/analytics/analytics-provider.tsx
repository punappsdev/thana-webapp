"use client";

import { GoogleTagManager } from "@next/third-parties/google";
import { useConsent } from "@/components/consent/use-consent";

const GTM_ID = "GTM-K3HSCB6S";

export function AnalyticsProvider() {
  const { analytics } = useConsent();

  if (analytics !== "granted") return null;

  return <GoogleTagManager gtmId={GTM_ID} />;
}
