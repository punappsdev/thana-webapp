"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleTagManager } from "@next/third-parties/google";
import { useConsent } from "@/components/consent/use-consent";
import { pushGoogleConsent } from "@/lib/consent-effects";

const GTM_ID = "GTM-K3HSCB6S";

export function AnalyticsProvider() {
  const consent = useConsent();
  const shouldLoad =
    consent.status === "decided" && (consent.analytics || consent.marketing);
  const initialized = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!shouldLoad) return;

    if (!initialized.current) {
      // Queue the default command before @next/third-parties pushes gtm.start.
      pushGoogleConsent("default", consent);
      initialized.current = true;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [consent, shouldLoad]);

  if (!shouldLoad || !ready) return null;
  return <GoogleTagManager gtmId={GTM_ID} />;
}
