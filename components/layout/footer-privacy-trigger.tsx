"use client";

import { PrivacyPolicyDialog } from "@/components/quote/privacy-policy-dialog";

export function FooterPrivacyTrigger({ label }: { label: string }) {
  return (
    <span
      className="[&>button]:font-body-sm [&>button]:font-normal [&>button]:text-muted-foreground [&>button]:no-underline [&>button]:transition-all [&>button:hover]:text-primary"
    >
      <PrivacyPolicyDialog label={label} />
    </span>
  );
}
