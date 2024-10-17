import { dateToTaxYear } from "./utils";

describe("dateToTaxYear", () => {

  test("Personal tax year", () => {
    expect(dateToTaxYear("2020-04-05")).toBe(2019);
    expect(dateToTaxYear("2020-04-06")).toBe(2020);
  });

  test("Company tax year", () => {
    expect(dateToTaxYear("2020-03-31", 4)).toBe(2019);
    expect(dateToTaxYear("2020-04-01", 4)).toBe(2020);
  });

})