import { dateToTaxYear, formatCurrency, formatDate } from "./utils";

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


describe("formatCurrency", () => {

  test("Whole number", () => {
    expect(formatCurrency(123)).toBe("£123");
  });

  test("Decimal", () => {
    expect(formatCurrency(123.4)).toBe("£123.40");
    expect(formatCurrency(123.45)).toBe("£123.45");
  });

  test("Thousands", () => {
    expect(formatCurrency(1234)).toBe("£1,234");
    expect(formatCurrency(123456789.01)).toBe("£123,456,789.01");
  });

})


describe("formatDate", () => {

  test("Date", () => {
    expect(formatDate("2020-04-05")).toBe("5 April 2020");
  });

})