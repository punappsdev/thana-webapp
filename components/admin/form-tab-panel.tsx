"use client";

import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * A tab panel that is safe to put form fields in.
 *
 * Radix unmounts the inactive panel, so any input inside it disappears from the
 * DOM and never reaches the submitted FormData — filling the English title then
 * publishing from the Thai tab silently dropped it. `forceMount` keeps every
 * panel mounted and CSS hides the inactive ones; `display:none` inputs are still
 * submitted, so the whole form arrives no matter which tab is open.
 */
export function FormTabPanel({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <TabsContent value={value} forceMount className={cn("data-[state=inactive]:hidden", className)}>
      {children}
    </TabsContent>
  );
}
