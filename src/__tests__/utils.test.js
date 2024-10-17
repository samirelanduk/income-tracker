import { dateToTaxYear, formatCurrency, formatDate } from "../utils";
import { getComponents, annotateSalaryComponent } from "../utils";
import { calculatePersonalAllowance } from "../utils";
import { predictIncomeTax, predictEmployeeNI, predictDirectorsEmployeeNi, predictStudentLoan } from "../utils";

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
      {type: "salary", amount: 5000, incomeTax: -1096.5, employeeNI: 423.26, studentLoan: 300, color: "red", company: "Sunrise Ventures", date: "2022-01-06", future: true, gross: 5000, net: 5373.24, transactionIndex: 3},
      {type: "salary", amount: 7000, incomeTax: 1190.35, employeeNI: 463.26, studentLoan: 480, color: "red", company: "Sunrise Ventures", date: "2022-02-06", future: true, gross: 7000, net: 4866.39, transactionIndex: 4},
      {type: "salary", amount: 5000, incomeTax: 790.35, employeeNI: 423.26, studentLoan: 300, color: "red", company: "Sunrise Ventures", date: "2022-03-06", future: true, gross: 5000, net: 3486.39, transactionIndex: 5},
      {type: "salary", amount: 5000, incomeTax: 952.37, employeeNI: 472.35, studentLoan: 298, color: "red", company: "Sunrise Ventures", date: "2022-04-06", future: true, gross: 5000, net: 3277.28, transactionIndex: 6},
      {type: "salary", amount: 5000, incomeTax: 952.36, employeeNI: 472.35, studentLoan: 298, color: "red", company: "Sunrise Ventures", date: "2022-05-06", future: true, gross: 5000, net: 3277.29, transactionIndex: 7},
      {type: "salary", amount: 5000, incomeTax: 0, employeeNI: 0, studentLoan: 0, color: "red", company: "Sunrise Ventures", date: "2022-06-06", future: true, gross: 5000, net: 5000, transactionIndex: 8},
      {type: "salary", amount: 50000, incomeTax: 20427.21, employeeNI: 1905.04, studentLoan: 4348, color: "red", company: "Sunrise Ventures", date: "2022-07-06", future: true, gross: 50000, net: 23319.75, transactionIndex: 9},
      {type: "salary", amount: 5000, incomeTax: -19430.55, employeeNI: 442.54, studentLoan: 298, color: "red", company: "Sunrise Ventures", date: "2022-08-06", future: true, gross: 5000, net: 23690.01, transactionIndex: 10},

      {type: "salary", amount: 3200, incomeTax: 1000, employeeNI: 200, studentLoan: 600, color: "purple", company: "Blue Horizon", date: "2021-10-06", future: false, gross: 5000, net: 3200, transactionIndex: 0},
      {type: "salary", amount: 3200, incomeTax: 1000, employeeNI: 200, studentLoan: 600, color: "purple", company: "Blue Horizon", date: "2021-11-06", future: false, gross: 5000, net: 3200, transactionIndex: 1},
      {type: "dividend", amount: 2000, color: "purple", company: "Blue Horizon", date: "2021-11-06", future: false, transactionIndex: 1},
      {type: "salary", amount: 5000, incomeTax: 1000, employeeNI: 200, studentLoan: 600, color: "purple", company: "Blue Horizon", date: "2021-12-06", future: true, gross: 5000, net: 3200, transactionIndex: 2},
      {type: "salary", amount: 5000, incomeTax: -1096.5, employeeNI: 651.84, studentLoan: 300, color: "purple", company: "Blue Horizon", date: "2022-01-06", future: true, gross: 5000, net: 5144.66, transactionIndex: 3},
      {type: "salary", amount: 7000, incomeTax: 1190.35, employeeNI: 840, studentLoan: 480, color: "purple", company: "Blue Horizon", date: "2022-02-06", future: true, gross: 7000, net: 4489.65, transactionIndex: 4},
      {type: "salary", amount: 5000, incomeTax: 790.35, employeeNI: 600, studentLoan: 300, color: "purple", company: "Blue Horizon", date: "2022-03-06", future: true, gross: 5000, net: 3309.65, transactionIndex: 5},
      {type: "salary", amount: 5000, incomeTax: 952.37, employeeNI: 0, studentLoan: 298, color: "purple", company: "Blue Horizon", date: "2022-04-06", future: true, gross: 5000, net: 3749.63, transactionIndex: 6},
      {type: "salary", amount: 5000, incomeTax: 952.36, employeeNI: 0, studentLoan: 298, color: "purple", company: "Blue Horizon", date: "2022-05-06", future: true, gross: 5000, net: 3749.64, transactionIndex: 7},
      {type: "salary", amount: 5000, incomeTax: 0, employeeNI: 0, studentLoan: 0, color: "purple", company: "Blue Horizon", date: "2022-06-06", future: true, gross: 5000, net: 5000, transactionIndex: 8},
      {type: "salary", amount: 50000, incomeTax: 20427.21, employeeNI: 5561.69, studentLoan: 4348, color: "purple", company: "Blue Horizon", date: "2022-07-06", future: true, gross: 50000, net: 19663.1, transactionIndex: 9},
      {type: "salary", amount: 5000, incomeTax: -19430.55, employeeNI: 162.5, studentLoan: 298, color: "purple", company: "Blue Horizon", date: "2022-08-06", future: true, gross: 5000, net: 23970.05, transactionIndex: 10},
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
      incomeTax: 57.1,
      employeeNI: 288.45,
      studentLoan: 118,
      gross: 3000,
      net: 2536.45,
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
      incomeTax: 57.1,
      employeeNI: 797.19,
      studentLoan: 118,
      gross: 3000,
      net: 2027.71,
      date: "2022-06-12",
      future: true,
    });
  });

});


describe("calculatePersonalAllowance", () => {

  test("Full personal allowance", () => {
    expect(calculatePersonalAllowance(99999, 12570, 2021)).toBe(12570);
    expect(calculatePersonalAllowance(100000, 12570, 2021)).toBe(12570);
  });

  test("Tapered personal allowance", () => {
    expect(calculatePersonalAllowance(100001, 12570, 2021)).toBe(12569.5);
    expect(calculatePersonalAllowance(100002, 12570, 2021)).toBe(12569);
    expect(calculatePersonalAllowance(100010, 12570, 2021)).toBe(12565);
    expect(calculatePersonalAllowance(110000, 12570, 2021)).toBe(7570);
    expect(calculatePersonalAllowance(120000, 12570, 2021)).toBe(2570);
    expect(calculatePersonalAllowance(125138, 12570, 2021)).toBe(1);
    expect(calculatePersonalAllowance(125139, 12570, 2021)).toBe(0.5);
    expect(calculatePersonalAllowance(125140, 12570, 2021)).toBe(0);
    expect(calculatePersonalAllowance(200000, 12570, 2021)).toBe(0);
  });

  test("Custom personal allowance", () => {
    expect(calculatePersonalAllowance(110000, 10000, 2021)).toBe(5000);
    expect(calculatePersonalAllowance(120000, 10000, 2021)).toBe(0);
  });
});


describe("predictIncomeTax", () => {

  test("Below threshold", () => {
    expect(predictIncomeTax(0, "2021-07-23", 0)).toBe(0);
    expect(predictIncomeTax(1257, "2021-07-23", 0)).toBe(0);
    expect(predictIncomeTax(1257, "2021-07-23", 100)).toBe(-100);
  });

  test("Basic rate", () => {
    expect(predictIncomeTax(2400, "2021-05-23", 30.5)).toBe(30.2);
  });

  test("Higher rate", () => {
    expect(predictIncomeTax(9500, "2023-04-23", 0)).toBe(2985.7);
    expect(predictIncomeTax(43000, "2024-01-23", 12686.66)).toBe(-5962.99);
    expect(predictIncomeTax(9166.67, "2023-04-23", 0)).toBe(2785.7);
    expect(predictIncomeTax(9166.67*2, "2023-05-23", 2785.7)).toBe(2785.7);
  });

  test("Additional rate", () => {
    expect(predictIncomeTax(10999.83, "2023-04-23", 0)).toBe(3800.17);
    expect(predictIncomeTax(10999.83*2, "2023-05-23", 3800.17)).toBe(3800.18);
  });

});


describe("predictEmployeeNI", () => {

  test("Below threshold", () => {
    expect(predictEmployeeNI(0, "2021-07-23")).toBe(0);
    expect(predictEmployeeNI(1048, "2024-04-06")).toBe(0);
    expect(predictEmployeeNI(1048, "2024-01-06")).toBe(0);
    expect(predictEmployeeNI(1048, "2023-04-06")).toBe(0);
    expect(predictEmployeeNI(1048, "2022-07-06")).toBe(0);
    expect(predictEmployeeNI(823, "2022-04-06")).toBe(0);
    expect(predictEmployeeNI(797, "2021-04-06")).toBe(0);
    expect(predictEmployeeNI(792, "2020-04-06")).toBe(0);
    expect(predictEmployeeNI(719, "2019-04-06")).toBe(0);
  });

  test("Below UEL", () => {
    expect(predictEmployeeNI(1049, "2024-04-06")).toBe(0.08);
    expect(predictEmployeeNI(4189, "2024-04-06")).toBe(251.28);
    expect(predictEmployeeNI(1049, "2024-01-06")).toBe(0.1);
    expect(predictEmployeeNI(1049, "2023-04-06")).toBe(0.12);
    expect(predictEmployeeNI(1049, "2022-07-06")).toBe(0.13);
    expect(predictEmployeeNI(824, "2022-04-06")).toBe(0.13);
    expect(predictEmployeeNI(798, "2021-04-06")).toBe(0.12);
    expect(predictEmployeeNI(793, "2020-04-06")).toBe(0.12);
    expect(predictEmployeeNI(4167, "2020-04-06")).toBe(405);
    expect(predictEmployeeNI(720, "2019-04-06")).toBe(0.08);
  });

  test("Above UEL", () => {
    expect(predictEmployeeNI(5000, "2024-04-23")).toBe(267.5);
    expect(predictEmployeeNI(5000, "2024-02-23")).toBe(330.32);
  });

});


describe("predictDirectorsEmployeeNi", () => {

  test("predictDirectorsEmployeeNi", () => {
    expect(predictDirectorsEmployeeNi(9500, "2023-04-23", 0)).toBe(0);
    expect(predictDirectorsEmployeeNi(19000, "2023-05-23", 0)).toBe(771.6);
    expect(predictDirectorsEmployeeNi(28500, "2023-06-23", 771.6)).toBe(1140);
    expect(predictDirectorsEmployeeNi(38000, "2023-07-23", 1911.6)).toBe(1140);
    expect(predictDirectorsEmployeeNi(43000, "2024-01-23", 3051.6)).toBe(447.85);
    expect(predictDirectorsEmployeeNi(53000, "2024-03-23", 3829.77)).toBe(560.33);

    expect(predictDirectorsEmployeeNi(6750, "2022-04-23", 0)).toBe(0);
    expect(predictDirectorsEmployeeNi(15750, "2022-05-23", 0)).toBe(509.07);
    expect(predictDirectorsEmployeeNi(24250, "2022-06-23", 509.06)).toBe(1126.26);
    expect(predictDirectorsEmployeeNi(28150, "2022-07-23", 1635.32)).toBe(516.75);
    expect(predictDirectorsEmployeeNi(35650, "2022-08-23", 2152.07)).toBe(993.74);
    expect(predictDirectorsEmployeeNi(45150, "2022-09-23", 3145.82)).toBe(1258.75);
    expect(predictDirectorsEmployeeNi(56150, "2022-10-23", 4404.56)).toBe(869.51);
    expect(predictDirectorsEmployeeNi(61750, "2022-11-23", 5274.06)).toBe(-77.59);
    expect(predictDirectorsEmployeeNi(67350, "2022-12-23", 5196.88)).toBe(152.42);
    expect(predictDirectorsEmployeeNi(78850, "2023-1-23", 5349.76)).toBe(313.4);
    expect(predictDirectorsEmployeeNi(90350, "2023-2-23", 5663.71)).toBe(313.3);
    expect(predictDirectorsEmployeeNi(99850, "2023-3-23", 5977.66)).toBe(258.62);
  });

});


describe("predictStudentLoan", () => {

  test("Below threshold", () => {
    expect(predictStudentLoan(0, "2021-07-23")).toBe(0);
    expect(predictStudentLoan(1500, "2021-07-23")).toBe(0);
    expect(predictStudentLoan(1657, "2021-07-23")).toBe(0);
    
  });
  
  test("Above threshold", () => {
    expect(predictStudentLoan(1670, "2021-07-23")).toBe(1);
    expect(predictStudentLoan(5000, "2024-05-06")).toBe(262);
    expect(predictStudentLoan(9100, "2023-04-17")).toBe(653);
    expect(predictStudentLoan(9500, "2023-04-17")).toBe(689);
    expect(predictStudentLoan(11000, "2022-10-25")).toBe(838);
  });

})