"use client";

import { openCookieSettings } from "@/lib/consent-store";

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className="cursor-pointer font-body-sm font-normal text-muted-foreground no-underline transition-colors hover:text-primary active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {label}
    </button>
  );
}
