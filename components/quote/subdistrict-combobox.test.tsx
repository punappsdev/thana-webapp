// @vitest-environment jsdom
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { SubdistrictCombobox } from "@/components/quote/subdistrict-combobox";
import { getSubdistrictsForDistrict } from "@/lib/subdistricts";
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

const district = getDistrictsForProvince(PHUKET_CODE).find((item) => item.code === "8301");
const subdistrict = getSubdistrictsForDistrict("8301")[0];

function SubdistrictForm() {
  const [value, setValue] = useState(subdistrict.code);

  return (
    <form data-testid="subdistrict-form">
      <SubdistrictCombobox
        id="subdistrict"
        name="subdistrict"
        label="Sub-district"
        provinceCode={PHUKET_CODE}
        districtValue={district?.nameTh ?? ""}
        value={value}
        locale="th"
        placeholder="Choose subdistrict"
        chooseDistrictText="Choose district first"
        onValueChange={setValue}
      />
    </form>
  );
}

describe("SubdistrictCombobox", () => {
  it("submits the localized subdistrict name while selecting by subdistrict code", () => {
    expect(district).toBeDefined();
    expect(subdistrict).toBeDefined();

    render(<SubdistrictForm />);
    const form = screen.getByTestId("subdistrict-form") as HTMLFormElement;

    // The harness starts with the source code, while the form contract remains the localized name.
    expect(new FormData(form).get("subdistrict")).toBe(subdistrict.nameTh);

    fireEvent.click(screen.getByRole("combobox"));

    const option = screen.getByRole("option", { name: subdistrict.nameTh });
    expect(option).toHaveAttribute("aria-selected", "true");

    fireEvent.click(option);

    expect(new FormData(form).get("subdistrict")).toBe(subdistrict.nameTh);
  });
});
