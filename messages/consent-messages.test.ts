import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import th from "@/messages/th.json";

const CONSENT_KEYS = [
  "bannerAriaLabel",
  "bannerTitle",
  "bannerBody",
  "privacyPolicy",
  "accept",
  "reject",
  "manage",
  "dialogTitle",
  "dialogBody",
  "necessaryTitle",
  "necessaryDescription",
  "functionalTitle",
  "functionalDescription",
  "analyticsTitle",
  "analyticsDescription",
  "marketingTitle",
  "marketingDescription",
  "alwaysOn",
  "on",
  "off",
  "learnMore",
  "save",
] as const;

describe("four-category consent translations", () => {
  it("keeps the Thai and English consent keys in parity", () => {
    expect(Object.keys(en.Consent).sort()).toEqual([...CONSENT_KEYS].sort());
    expect(Object.keys(th.Consent).sort()).toEqual([...CONSENT_KEYS].sort());
  });

  it("documents all four categories in both privacy policies", () => {
    const englishCookies = en.Legal.privacy.sections.find(
      (section) => section.heading === "5. Use of Cookies",
    );
    const thaiCookies = th.Legal.privacy.sections.find(
      (section) => section.heading === "5. การใช้คุกกี้ (Cookies)",
    );

    expect(englishCookies?.body).toContain("Strictly necessary cookies");
    expect(englishCookies?.body).toContain("Functional cookies");
    expect(englishCookies?.body).toContain("Analytics and performance cookies");
    expect(englishCookies?.body).toContain("Marketing and targeting cookies");

    expect(thaiCookies?.body).toContain("คุกกี้ที่มีความจำเป็นอย่างยิ่ง");
    expect(thaiCookies?.body).toContain("คุกกี้เพื่อการทำงานของเว็บไซต์");
    expect(thaiCookies?.body).toContain("คุกกี้เพื่อการวิเคราะห์และวัดผล");
    expect(thaiCookies?.body).toContain("คุกกี้เพื่อการตลาดและโฆษณา");
  });
});
