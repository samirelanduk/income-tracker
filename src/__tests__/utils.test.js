import { dateToTaxYear, formatCurrency, formatDate } from "../utils";
import { getComponents, annotateSalaryComponent } from "../utils";

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


describe("getComponents", () => {

  test("All components", () => {
    const data = [
      {
        name: "Sunrise Ventures",
        color: "red",
        cumulativeNi: true,
        transactions: [
          {
            date: "2021-03-23",
            amount: 3000,
            components: [
              {type: "dividend", amount: 500},
              {type: "salary", amount: 2500}
            ]
          },
          {
            date: "2021-04-23",
            amount: 3000,
            components: [
              {type: "salary", amount: 3000, incomeTax: 1000, employeeNI: 200, studentLoan: 100}
            ]
          },
          {
            date: "2021-05-23",
            amount: -200
          },
          {
            date: "2021-06-15",
            amount: 2000,
            future: true,
            components: [
              {type: "dividend", amount: 2000}
            ]
          }
        ]
      },
      {
        name: "Blue Horizon",
        color: "purple",
        cumulativeNi: false,
        transactions: [
          {
            date: "2021-06-15",
            amount: 2000,
            components: [
              {type: "dividend", amount: 2000}
            ]
          }
        ]
      }
    ]
    expect(getComponents(data, null, null, null, null, false)).toEqual([
      {type: "dividend", amount: 500, color: "red", company: "Sunrise Ventures", date: "2021-03-23", future: false, transactionIndex: 0},
      {type: "salary", amount: 2500, color: "red", company: "Sunrise Ventures", date: "2021-03-23", future: false, incomeTax: 0, employeeNI: 0, studentLoan: 0, gross: 2500, net: 2500, transactionIndex: 0},
      {type: "salary", amount: 3000, incomeTax: 1000, employeeNI: 200, studentLoan: 100, color: "red", company: "Sunrise Ventures", date: "2021-04-23", future: false, gross: 4300, net: 3000, transactionIndex: 1},
      {type: "dividend", amount: 2000, color: "purple", company: "Blue Horizon", date: "2021-06-15", future: false, transactionIndex: 0},
    ]);
  });

  test("Components of type", () => {
    const data = [
      {
        name: "Sunrise Ventures",
        color: "red",
        cumulativeNi: true,
        transactions: [
          {
            date: "2021-03-23",
            amount: 3000,
            components: [
              {type: "dividend", amount: 500},
              {type: "salary", amount: 2500}
            ]
          },
          {
            date: "2021-04-23",
            amount: 3000,
            components: [
              {type: "salary", amount: 3000, incomeTax: 1000, employeeNI: 200, studentLoan: 100}
            ]
          },
          {
            date: "2021-06-15",
            amount: 2000,
            future: true,
            components: [
              {type: "dividend", amount: 2000}
            ]
          }
        ]
      },
      {
        name: "Blue Horizon",
        color: "purple",
        cumulativeNi: false,
        transactions: [
          {
            date: "2021-06-15",
            amount: 2000,
            components: [
              {type: "dividend", amount: 2000}
            ]
          }
        ]
      }
    ]
    expect(getComponents(data, "dividend", null, null, null, false)).toEqual([
      {type: "dividend", amount: 500, color: "red", company: "Sunrise Ventures", date: "2021-03-23", future: false, transactionIndex: 0},
      {type: "dividend", amount: 2000, color: "purple", company: "Blue Horizon", date: "2021-06-15", future: false, transactionIndex: 0},
    ]);
  });

  test("Components of company", () => {
    const data = [
      {
        name: "Sunrise Ventures",
        color: "red",
        cumulativeNi: true,
        transactions: [
          {
            date: "2021-03-23",
            amount: 3000,
            components: [
              {type: "dividend", amount: 500},
              {type: "salary", amount: 2500}
            ]
          },
          {
            date: "2021-04-23",
            amount: 3000,
            components: [
              {type: "salary", amount: 3000, incomeTax: 1000, employeeNI: 200, studentLoan: 100}
            ]
          },
          {
            date: "2021-05-23",
            amount: -200
          },
          {
            date: "2021-06-15",
            amount: 2000,
            future: true,
            components: [
              {type: "dividend", amount: 2000}
            ]
          }
        ]
      },
      {
        name: "Blue Horizon",
        color: "purple",
        cumulativeNi: false,
        transactions: [
          {
            date: "2021-06-15",
            amount: 2000,
            components: [
              {type: "dividend", amount: 2000}
            ]
          }
        ]
      }
    ]
    expect(getComponents(data, null, "Sunrise Ventures", null, null, false)).toEqual([
      {type: "dividend", amount: 500, color: "red", company: "Sunrise Ventures", date: "2021-03-23", future: false, transactionIndex: 0},
      {type: "salary", amount: 2500, color: "red", company: "Sunrise Ventures", date: "2021-03-23", future: false, incomeTax: 0, employeeNI: 0, studentLoan: 0, gross: 2500, net: 2500, transactionIndex: 0},
      {type: "salary", amount: 3000, incomeTax: 1000, employeeNI: 200, studentLoan: 100, color: "red", company: "Sunrise Ventures", date: "2021-04-23", future: false, gross: 4300, net: 3000, transactionIndex: 1},
    ]);
  });

  test("Components of specific personal tax year", () => {
    const data = [
      {
        name: "Sunrise Ventures",
        color: "red",
        cumulativeNi: true,
        transactions: [
          {
            date: "2021-03-23",
            amount: 3000,
            components: [
              {type: "dividend", amount: 500},
              {type: "salary", amount: 2500}
            ]
          },
          {
            date: "2021-04-23",
            amount: 3000,
            components: [
              {type: "salary", amount: 3000, incomeTax: 1000, employeeNI: 200, studentLoan: 100}
            ]
          },
          {
            date: "2021-06-15",
            amount: 2000,
            future: true,
            components: [
              {type: "dividend", amount: 2000}
            ]
          }
        ]
      },
      {
        name: "Blue Horizon",
        color: "purple",
        cumulativeNi: false,
        transactions: [
          {
            date: "2021-04-01",
            amount: 1000,
            components: [
              {type: "dividend", amount: 1000, personalDate: "2022-03-12"}
            ]
          },
          {
            date: "2021-04-05",
            amount: 2000,
            components: [
              {type: "dividend", amount: 2000, companyDate: "2022-03-12"}
            ]
          },
          {
            date: "2021-04-06",
            amount: 8000,
            components: [
              {type: "dividend", amount: 8000}
            ]
          }
        ]
      }
    ]
    expect(getComponents(data, null, null, 2021, null, false)).toEqual([
      {type: "salary", amount: 3000, incomeTax: 1000, employeeNI: 200, studentLoan: 100, color: "red", company: "Sunrise Ventures", date: "2021-04-23", future: false, gross: 4300, net: 3000, transactionIndex: 1},
      {type: "dividend", amount: 1000, color: "purple", company: "Blue Horizon", date: "2021-04-01", future: false, transactionIndex: 0, personalDate: "2022-03-12"},
      {type: "dividend", amount: 8000, color: "purple", company: "Blue Horizon", date: "2021-04-06", future: false, transactionIndex: 2},,
    ]);
  });

  test("Components of specific company tax year", () => {
    const data = [
      {
        name: "Sunrise Ventures",
        color: "red",
        cumulativeNi: true,
        monthStart: 9,
        transactions: [
          {
            date: "2021-03-23",
            amount: 5000,
            components: [
              {type: "dividend", amount: 5000, companyDate: "2022-03-12"}
            ]
          },
          {
            date: "2021-08-31",
            amount: 1000,
            components: [
              {type: "dividend", amount: 1000, personalDate: "2022-03-12"}
            ]
          },
          {
            date: "2021-09-01",
            amount: 3000,
            components: [
              {type: "dividend", amount: 500},
              {type: "salary", amount: 2500}
            ]
          },
          {
            date: "2021-09-15",
            amount: 200,
            components: [
              {type: "interest", amount: 200}
            ]
          }
        ]
      },
      {
        name: "Blue Horizon",
        color: "purple",
        cumulativeNi: false,
        transactions: [
          {
            date: "2021-04-01",
            amount: 1000,
            components: [
              {type: "dividend", amount: 1000, personalDate: "2022-03-12"}
            ]
          },
          {
            date: "2021-04-05",
            amount: 2000,
            components: [
              {type: "dividend", amount: 2000, companyDate: "2022-03-12"}
            ]
          },
          {
            date: "2021-04-06",
            amount: 8000,
            components: [
              {type: "dividend", amount: 8000}
            ]
          }
        ]
      }
    ]
    expect(getComponents(data, null, "Sunrise Ventures", 2021, null, false)).toEqual([
      {type: "dividend", amount: 5000, color: "red", company: "Sunrise Ventures", date: "2021-03-23", future: false, transactionIndex: 0, companyDate: "2022-03-12"},
      {type: "dividend", amount: 500, color: "red", company: "Sunrise Ventures", date: "2021-09-01", future: false, transactionIndex: 2},
      {type: "salary", amount: 2500, color: "red", company: "Sunrise Ventures", date: "2021-09-01", future: false, incomeTax: 0, employeeNI: 0, studentLoan: 0, gross: 2500, net: 2500, transactionIndex: 2},
      {type: "interest", amount: 200, color: "red", company: "Sunrise Ventures", date: "2021-09-15", future: false, transactionIndex: 3},
    ]);
  });

  test("Future components", () => {
    const data = [
      {
        name: "Sunrise Ventures",
        color: "red",
        cumulativeNi: false,
        monthStart: 2,
        transactions: [
          {
            date: "2021-10-06",
            amount: 5000,
            components: [
              {type: "salary", amount: 3200, incomeTax: 1000, employeeNI: 200, studentLoan: 600}
            ]
          },
          {
            date: "2021-11-06",
            amount: 7000,
            components: [
              {type: "salary", amount: 3200, incomeTax: 1000, employeeNI: 200, studentLoan: 600},
              {type: "dividend", amount: 2000}
            ]
          },
          {
            date: "2021-12-06",
            amount: 5000,
            future: true,
            components: [
              {type: "salary", amount: 5000, incomeTax: 1000, employeeNI: 200, studentLoan: 600}
            ]
          },
          {
            date: "2022-01-06",
            amount: null,
            future: true,
            components: [
              {type: "salary", amount: 5000}
            ]
          },
          {
            date: "2022-02-06",
            amount: null,
            future: true,
            components: [
              {type: "salary", amount: 7000}
            ]
          },
          {
            date: "2022-03-06",
            amount: null,
            future: true,
            components: [
              {type: "salary", amount: 5000}
            ]
          },
          {
            date: "2022-04-06",
            amount: null,
            future: true,
            components: [
              {type: "salary", amount: 5000}
            ]
          },
          {
            date: "2022-05-06",
            amount: null,
            future: true,
            components: [
              {type: "salary", amount: 5000}
            ]
          },
          {
            date: "2022-06-06",
            amount: null,
            future: true,
            components: [
              {type: "salary", amount: 5000, incomeTax: 0, employeeNI: 0, studentLoan: 0}
            ]
          },
          {
            date: "2022-07-06",
            amount: null,
            future: true,
            components: [
              {type: "salary", amount: 50000}
            ]
          },
          {
            date: "2022-08-06",
            amount: null,
            future: true,
            components: [
              {type: "salary", amount: 5000}
            ]
          }
        ]
      },
      {
        name: "Blue Horizon",
        color: "purple",
        cumulativeNi: true,
        monthStart: 11,
      }
    ]
    data[1].transactions = JSON.parse(JSON.stringify(data[0].transactions));
    expect(getComponents(data, null, null, null, true)).toEqual([
      {type: "salary", amount: 3200, incomeTax: 1000, employeeNI: 200, studentLoan: 600, color: "red", company: "Sunrise Ventures", date: "2021-10-06", future: false, gross: 5000, net: 3200, transactionIndex: 0},
      {type: "salary", amount: 3200, incomeTax: 1000, employeeNI: 200, studentLoan: 600, color: "red", company: "Sunrise Ventures", date: "2021-11-06", future: false, gross: 5000, net: 3200, transactionIndex: 1},
      {type: "dividend", amount: 2000, color: "red", company: "Sunrise Ventures", date: "2021-11-06", future: false, transactionIndex: 1},
      {type: "salary", amount: 5000, incomeTax: 1000, employeeNI: 200, studentLoan: 600, color: "red", company: "Sunrise Ventures", date: "2021-12-06", future: true, gross: 5000, net: 3200, transactionIndex: 2},
      {type: "salary", amount: 5000, incomeTax: 1000, employeeNI: 423.26, studentLoan: 300, color: "red", company: "Sunrise Ventures", date: "2022-01-06", future: true, gross: 5000, net: 3276.74, transactionIndex: 3},
      {type: "salary", amount: 7000, incomeTax: 1400, employeeNI: 463.26, studentLoan: 480, color: "red", company: "Sunrise Ventures", date: "2022-02-06", future: true, gross: 7000, net: 4656.74, transactionIndex: 4},
      {type: "salary", amount: 5000, incomeTax: 1000, employeeNI: 423.26, studentLoan: 300, color: "red", company: "Sunrise Ventures", date: "2022-03-06", future: true, gross: 5000, net: 3276.74, transactionIndex: 5},
      {type: "salary", amount: 5000, incomeTax: 1371.67, employeeNI: 472.35, studentLoan: 298, color: "red", company: "Sunrise Ventures", date: "2022-04-06", future: true, gross: 5000, net: 2857.98, transactionIndex: 6},
      {type: "salary", amount: 5000, incomeTax: 1371.66, employeeNI: 472.35, studentLoan: 298, color: "red", company: "Sunrise Ventures", date: "2022-05-06", future: true, gross: 5000, net: 2857.99, transactionIndex: 7},
      {type: "salary", amount: 5000, incomeTax: 0, employeeNI: 0, studentLoan: 0, color: "red", company: "Sunrise Ventures", date: "2022-06-06", future: true, gross: 5000, net: 5000, transactionIndex: 8},
      {type: "salary", amount: 50000, incomeTax: 18750.01, employeeNI: 1905.04, studentLoan: 4348, color: "red", company: "Sunrise Ventures", date: "2022-07-06", future: true, gross: 50000, net: 24996.95, transactionIndex: 9},
      {type: "salary", amount: 5000, incomeTax: -17753.35, employeeNI: 442.54, studentLoan: 298, color: "red", company: "Sunrise Ventures", date: "2022-08-06", future: true, gross: 5000, net: 22012.81, transactionIndex: 10},

      {type: "salary", amount: 3200, incomeTax: 1000, employeeNI: 200, studentLoan: 600, color: "purple", company: "Blue Horizon", date: "2021-10-06", future: false, gross: 5000, net: 3200, transactionIndex: 0},
      {type: "salary", amount: 3200, incomeTax: 1000, employeeNI: 200, studentLoan: 600, color: "purple", company: "Blue Horizon", date: "2021-11-06", future: false, gross: 5000, net: 3200, transactionIndex: 1},
      {type: "dividend", amount: 2000, color: "purple", company: "Blue Horizon", date: "2021-11-06", future: false, transactionIndex: 1},
      {type: "salary", amount: 5000, incomeTax: 1000, employeeNI: 200, studentLoan: 600, color: "purple", company: "Blue Horizon", date: "2021-12-06", future: true, gross: 5000, net: 3200, transactionIndex: 2},
      {type: "salary", amount: 5000, incomeTax: 1000, employeeNI: 652.32, studentLoan: 300, color: "purple", company: "Blue Horizon", date: "2022-01-06", future: true, gross: 5000, net: 3047.68, transactionIndex: 3},
      {type: "salary", amount: 7000, incomeTax: 1400, employeeNI: 840, studentLoan: 480, color: "purple", company: "Blue Horizon", date: "2022-02-06", future: true, gross: 7000, net: 4280, transactionIndex: 4},
      {type: "salary", amount: 5000, incomeTax: 1000, employeeNI: 600, studentLoan: 300, color: "purple", company: "Blue Horizon", date: "2022-03-06", future: true, gross: 5000, net: 3100, transactionIndex: 5},
      {type: "salary", amount: 5000, incomeTax: 1371.67, employeeNI: 0, studentLoan: 298, color: "purple", company: "Blue Horizon", date: "2022-04-06", future: true, gross: 5000, net: 3330.33, transactionIndex: 6},
      {type: "salary", amount: 5000, incomeTax: 1371.66, employeeNI: 16.43, studentLoan: 298, color: "purple", company: "Blue Horizon", date: "2022-05-06", future: true, gross: 5000, net: 3313.91, transactionIndex: 7},
      {type: "salary", amount: 5000, incomeTax: 0, employeeNI: 0, studentLoan: 0, color: "purple", company: "Blue Horizon", date: "2022-06-06", future: true, gross: 5000, net: 5000, transactionIndex: 8},
      {type: "salary", amount: 50000, incomeTax: 18750.01, employeeNI: 5456.55, studentLoan: 4348, color: "purple", company: "Blue Horizon", date: "2022-07-06", future: true, gross: 50000, net: 21445.44, transactionIndex: 9},
      {type: "salary", amount: 5000, incomeTax: -17753.35, employeeNI: 162.5, studentLoan: 298, color: "purple", company: "Blue Horizon", date: "2022-08-06", future: true, gross: 5000, net: 22292.85, transactionIndex: 10},

    ]);
  });

});


describe("annotateSalaryComponent", () => {

  test("Past component with values", () => {
    const component = {type: "salary", amount: 3000, incomeTax: 1000, employeeNI: 0, studentLoan: 100};
    annotateSalaryComponent(component, 0, 0, 0, false);
    expect(component).toEqual({
      type: "salary",
      amount: 3000,
      incomeTax: 1000,
      employeeNI: 0,
      studentLoan: 100,
      gross: 4100,
      net: 3000,
    });
  });

  test("Past component without values", () => {
    const component = {type: "salary", amount: 3000};
    annotateSalaryComponent(component, 0, 0, 0, false);
    expect(component).toEqual({
      type: "salary",
      amount: 3000,
      incomeTax: 0,
      employeeNI: 0,
      studentLoan: 0,
      gross: 3000,
      net: 3000,
    });
  });

  test("Future component with values", () => {
    const component = {type: "salary", amount: 3000, incomeTax: 1000, employeeNI: 0, studentLoan: 100, future: true};
    annotateSalaryComponent(component, 0, 0, 0, false);
    expect(component).toEqual({
      type: "salary",
      amount: 3000,
      incomeTax: 1000,
      employeeNI: 0,
      studentLoan: 100,
      gross: 3000,
      net: 1900,
      future: true,
    });
  });

  test("Future component without values", () => {
    const component = {type: "salary", amount: 3000, future: true, date: "2022-06-12"};
    annotateSalaryComponent(component, 15000, 4000, 2000, false);
    expect(component).toEqual({
      type: "salary",
      amount: 3000,
      incomeTax: 1315,
      employeeNI: 288.45,
      studentLoan: 118,
      gross: 3000,
      net: 1278.55,
      date: "2022-06-12",
      future: true,
    });
  });

  test("Future component without values, cumulative NI method", () => {
    const component = {type: "salary", amount: 3000, future: true, date: "2022-06-12"};
    annotateSalaryComponent(component, 15000, 4000, 10, true);
    expect(component).toEqual({
      type: "salary",
      amount: 3000,
      incomeTax: 1315,
      employeeNI: 1066.43,
      studentLoan: 118,
      gross: 3000,
      net: 500.57,
      date: "2022-06-12",
      future: true,
    });
  });

});