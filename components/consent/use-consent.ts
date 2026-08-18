"use client";

import { useSyncExternalStore } from "react";
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  subscribeConsent,
  type AnalyticsConsent,
} from "@/lib/consent-store";

export type UseConsentResult = {
  analytics: AnalyticsConsent;
  hydrated: boolean;
};

export function useConsent(): UseConsentResult {
  const analytics = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    subscribeConsent,
    () => true,
    () => false,
  );

  return { analytics, hydrated };
}
