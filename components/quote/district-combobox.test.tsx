// @vitest-environment jsdom
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { DistrictCombobox } from "@/components/quote/district-combobox";
import { getDistrictsForProvince } from "@/lib/districts";
import { PHUKET_CODE } from "@/lib/provinces";

afterEach(cleanup);

const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = () => undefined;
});

afterAll(() => {
  HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
});

const district = getDistrictsForProvince(PHUKET_CODE)[0];

function DistrictForm() {
  const [value, setValue] = useState(district.code);

  return (
    <form data-testid="district-form">
      <DistrictCombobox
        id="district"
        name="district"
        label="District"
        provinceCode={PHUKET_CODE}
        value={value}
        locale="th"
        placeholder="Choose district"
        chooseProvinceText="Choose province first"
        onValueChange={setValue}
      />
    </form>
  );
}

describe("DistrictCombobox", () => {
  it("submits the localized district name while selecting by district code", () => {
    expect(district).toBeDefined();

    render(<DistrictForm />);
    const form = screen.getByTestId("district-form") as HTMLFormElement;

    // The harness starts with the source code, while the form contract remains the localized name.
    expect(new FormData(form).get("district")).toBe(district.nameTh);

    fireEvent.click(screen.getByRole("combobox"));

    const option = screen.getByRole("option", { name: district.nameTh });
    expect(option).toHaveAttribute("aria-selected", "true");

    fireEvent.click(option);

    expect(new FormData(form).get("district")).toBe(district.nameTh);
  });
});
