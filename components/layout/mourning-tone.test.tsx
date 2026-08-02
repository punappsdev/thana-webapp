// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { MourningTone } from "@/components/layout/mourning-tone";

// Vitest runs without `globals`, so Testing Library never registers its own
// auto-cleanup — without this each test would inherit the previous DOM.
afterEach(cleanup);

/**
 * The greyscale rule must leave with the homepage. An earlier version used
 * React's hoisted-stylesheet form (`href` + `precedence`), which React parks in
 * <head> permanently — clicking through to any other page kept the whole site
 * grey until a full reload. These tests pin the two properties that prevent it.
 */
describe("MourningTone", () => {
  it("greys out the document root rather than a wrapper element", () => {
    const { container } = render(<MourningTone />);
    const style = container.querySelector("style");

    expect(style?.textContent).toContain("html{filter:grayscale(1)");
  });

  it("stays an in-place element instead of a hoisted stylesheet", () => {
    const { container } = render(<MourningTone />);
    const style = container.querySelector("style");

    // `data-precedence` is what React stamps on styles it has hoisted.
    expect(style).not.toBeNull();
    expect(style?.hasAttribute("data-precedence")).toBe(false);
    expect(document.head.querySelector("style")).toBeNull();
  });

  it("removes the rule when the page unmounts", () => {
    const { unmount } = render(<MourningTone />);
    unmount();

    const leftovers = [...document.querySelectorAll("style")].filter((node) =>
      node.textContent?.includes("grayscale"),
    );
    expect(leftovers).toHaveLength(0);
  });
});
