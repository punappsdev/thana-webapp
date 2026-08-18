// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useConsent } from "@/components/consent/use-consent";

afterEach(() => {
  cleanup();
});

describe("useConsent", () => {
  it("keeps the returned object stable while the store snapshot is unchanged", () => {
    const { result, rerender } = renderHook(() => useConsent());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
