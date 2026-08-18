"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  subscribeConsent,
  type ConsentSnapshot,
} from "@/lib/consent-store";

export type UseConsentResult = ConsentSnapshot & {
  hydrated: boolean;
};

export function useConsent(): UseConsentResult {
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    subscribeConsent,
    () => true,
    () => false,
  );

  return useMemo(
    () => ({ ...consent, hydrated }),
    [consent, hydrated],
  );
}
