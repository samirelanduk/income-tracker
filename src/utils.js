import { incomeTax, studentLoan, salaryIncomeTax, dividendIncomeTax, dividendAllowance, nationalInsurance } from "./hmrc";

export const dateToTaxYear = (date, monthStart) => {
  /**
   * Returns the tax year for a given date. If no month start is provided, a
   * cutoff of April 6th is used. If a month start is provided, a cutoff of
   * the 1st of that month is used.
   */

  const dateObj = new Date(date);
  const month = monthStart || 4;
  const day = monthStart ? 1 : 6;
  if (dateObj.getMonth() + 1 > month) {
    return dateObj.getFullYear();
  }
  if (dateObj.getMonth() + 1 === month && dateObj.getDate() >= day) {
    return dateObj.getFullYear();
  }
  return dateObj.getFullYear() - 1;
}


export const formatCurrency = amount => {
  /**
   * Formats a number as a currency string in GBP. Decimals are included if
   * the amount is not an integer.
   */

  const isInteger = Number.isInteger(amount);
  return amount.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: isInteger ? 0 : 2
  });
}


export const formatDate = date => {
  /**
   * Formats a date as a string in the format "day month year".
   */

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}


export const getComponents = (companies, type, companyName, taxYear, useFuture) => {
  /**
   * Gets all the components defined in some transactions dataset. You can
   * filter by component type, by company, or by tax year. You can also choose
   * to include future transactions or not.
   * 
   * Salary components will be annotated with additional fields.
   */

  const components = [];
  for (const company of companies) {
    const cumulative = {};
    if (companyName && company.name !== companyName) continue;
    for (let t = 0; t < company.transactions.length; t++) {
      const transaction = company.transactions[t];
      if (!useFuture && transaction.future) continue;
      for (const component of transaction.components || []) {
        const personalTaxYear = dateToTaxYear(component.personalDate || transaction.date);
        const companyTaxYear = dateToTaxYear(component.companyDate || transaction.date, company.monthStart);
        if (!(personalTaxYear in cumulative)) {
          cumulative[personalTaxYear] = {income: 0, incomeByDate: {}, incomeTax: 0, employeeNi: 0};
        }
        if (taxYear && (companyName ? companyTaxYear : personalTaxYear) !== taxYear) continue;
        if (type && component.type !== type) continue;
        const newComponent = {
          ...component,
          company: company.name,
          color: company.color,
          date: transaction.date,
          future: transaction.future || false,
          transactionIndex: t,
        }
        if (component.type === "salary") {
          annotateSalaryComponent(
            newComponent,
            cumulative[personalTaxYear].income,
            cumulative[personalTaxYear].incomeTax,
            cumulative[personalTaxYear].employeeNi,
            company.cumulativeNi
          );
          cumulative[personalTaxYear].income += newComponent.gross;
          cumulative[personalTaxYear].incomeTax += newComponent.incomeTax;
          cumulative[personalTaxYear].employeeNi += newComponent.employeeNI;
        }
        components.push(newComponent);
      }
    }
  }
  return components;
}


export const annotateSalaryComponent = (component, cumulativeIncome, cumulativeIncomeTax, cumulativeEmployeeNi, cumulativeNi) => {
  /**
   * Takes a salary component and annotates it. First it adds the deductions if
   * they are not given (assumed to be zero if it's a past transaction,
   * predicted if it's a future transaction). It then adds gross and net
   * attributes - the original amount is assumed to be the gross amount if it's
   * a future transaction, and the net amount if it's a past transaction.
   */

  if (component.future) {
    if (component.incomeTax === undefined) {
      component.incomeTax = predictIncomeTax(cumulativeIncome + component.amount, component.date, cumulativeIncomeTax);
    } else {
      component.incomeTax = component.incomeTax;
    }
    if (component.employeeNI === undefined) {
      if (cumulativeNi) {
        component.employeeNI = predictDirectorsEmployeeNi(
          cumulativeIncome + component.amount,
          component.date,
          cumulativeEmployeeNi
        );
      } else {
        component.employeeNI = predictEmployeeNI(component.amount, component.date);
      }
    } else {
      component.employeeNI = component.employeeNI;
    }
    if (component.studentLoan === undefined) {
      component.studentLoan = predictStudentLoan(component.amount, component.date);
    } else {
      component.studentLoan = component.studentLoan;
    }
    component.gross = component.amount;
    component.net = component.amount - component.incomeTax - component.employeeNI - component.studentLoan;
    component.net = Math.round(component.net * 100) / 100;
  } else {
    component.incomeTax = component.incomeTax || 0;
    component.employeeNI = component.employeeNI || 0;
    component.studentLoan = component.studentLoan || 0;
    component.net = component.amount;
    component.gross = component.amount + component.incomeTax + component.employeeNI + component.studentLoan;
    component.gross = Math.round(component.gross * 100) / 100;
  }
}


export const calculatePersonalAllowance = (totalIncome, defaultPersonalAllowance, taxYear) => {
  /**
   * Calculates the personal allowance for a given total income, defaulting to
   * the default personal allowance if the total income is below the threshold.
   */

  const threshold = incomeTax[taxYear].personalAllowanceThreshold;
  return totalIncome <= threshold ? (
    defaultPersonalAllowance
  ) : Math.max(defaultPersonalAllowance - (
    totalIncome - threshold
  ) / 2, 0);
}


export const predictIncomeTax = (salaryToDate, date, incomeTaxToDate) => {
  /**
   * Predicts what the income tax deduction will be for a given monthly salary
   * payment. Standard tax code is assumed.
   */

  const taxYear = dateToTaxYear(date);
  const incomeTaxData = incomeTax[taxYear];
  const salaryIncomeTaxData = salaryIncomeTax[taxYear];
  const monthIndex = new Date(date).getMonth();
  const monthNumber = monthIndex < 3 ? monthIndex + 10 : monthIndex - 2;
  const projectedTotalSalary = salaryToDate / monthNumber * 12;
  const annualPersonalAllowance = calculatePersonalAllowance(
    projectedTotalSalary, incomeTaxData.personalAllowance + 9, taxYear
  );
  const personalAllowance = annualPersonalAllowance / 12 * monthNumber;
  const higherBand = incomeTaxData.higherBand / 12 * monthNumber;
  const additionalBand = incomeTaxData.additionalBand / 12 * monthNumber;
  const taxableIncome = Math.max(salaryToDate - personalAllowance, 0);
  let taxOwed = 0;
  if (taxableIncome <= higherBand) {
    taxOwed = taxableIncome * salaryIncomeTaxData.basic;
  } else if (taxableIncome <= additionalBand) {
    taxOwed = (
      (higherBand * salaryIncomeTaxData.basic) +
      (taxableIncome - higherBand) * salaryIncomeTaxData.higher
    );
  } else {
    taxOwed = (
      (higherBand * salaryIncomeTaxData.basic) +
      (additionalBand - higherBand) * salaryIncomeTaxData.higher +
      (taxableIncome - additionalBand) * salaryIncomeTaxData.additional
    );
  }
  return Math.round((taxOwed - incomeTaxToDate) * 100) / 100;
}


export const predictEmployeeNI = (amount, date) => {
  /**
   * Predicts what the employee national insurance deduction will be for a given
   * monthly salary payment, assuming they are not using the cumulative method.
   */

  const taxYear = dateToTaxYear(date);
  const niData = nationalInsurance[taxYear];
  const dates = Object.keys(niData);
  const mostRecentDateToDate = dates.filter(
    d => new Date(d) <= new Date(date)
  ).sort().reverse()[0];
  const mostRecentData = niData[mostRecentDateToDate];
  const pt = mostRecentData.pt;
  const uel = mostRecentData.uel;
  let owed;
  if (amount <= pt) {
    owed = 0;
  } else if (amount <= uel) {
   owed = (amount - pt) * mostRecentData.employeeRate1;
  } else {
    owed = (uel - pt) * mostRecentData.employeeRate1 + 
    (amount - uel) * mostRecentData.employeeRate2;
  }
  return Math.round(owed * 100) / 100;
}


export const predictDirectorsEmployeeNi = (salaryToDate, date, employeeNIToDate) => {
  /**
   * Predicts what the employee national insurance deduction will be for a given
   * monthly salary payment, assuming they are using the cumulative method.
   */

  const taxYear = dateToTaxYear(date);
  const niData = nationalInsurance[taxYear];
  const rate1s = [];
  const rate2s = [];
  for (let n = 0; n < Object.keys(niData).length; n++) {
    const [start, periodData] = Object.entries(niData)[n];
    if (new Date(start) > new Date(date)) continue;
    const end = Object.keys(niData)[n - 1] || `${taxYear + 1}-04-06`;
    const startMonth = parseInt(start.split("-")[1]);
    const endMonth = parseInt(end.split("-")[1]);
    const months = endMonth > startMonth ? endMonth - startMonth : 12 - startMonth + endMonth;
    rate1s.push({rate: periodData.employeeRate1, months: months});
    rate2s.push({rate: periodData.employeeRate2, months: months});
  }
  const totalMonths = rate1s.map(r => r.months).reduce((a, b) => a + b, 0);
  const rate1 = rate1s.map(r => r.rate * (r.months / totalMonths)).reduce((a, b) => a + b, 0);
  const rate2 = rate2s.map(r => r.rate * (r.months / totalMonths)).reduce((a, b) => a + b, 0);
  const dates = Object.keys(niData);
  const mostRecentDateToDate = dates.filter(d => new Date(d) <= new Date(date)).sort().reverse()[0];
  const mostRecentData = niData[mostRecentDateToDate];
  const pt = mostRecentData.annualPt;
  const uel = mostRecentData.annualUel;
  let owedForYear;
  if (salaryToDate < pt) {
    owedForYear = 0;
  } else if (salaryToDate < uel) {
    owedForYear = (salaryToDate - pt) * rate1
  } else {
    owedForYear = (uel - pt) * rate1 + (salaryToDate - uel) * rate2;
  }
  return Math.round((owedForYear - employeeNIToDate) * 100) / 100;
}


export const predictStudentLoan = (amount, date) => {
  /**
   * Predicts what the plan 1 student loan deduction will be for a given monthly
   * salary payment.
   */
  
  const taxYear = dateToTaxYear(date);
  const studentLoanData = studentLoan[taxYear];
  const threshold = studentLoanData.threshold / 12;
  const rate = studentLoanData.rate;
  const owed = parseInt(Math.max(amount - threshold, 0) * rate);
  return Math.round(owed * 100) / 100;
}


export const calculateIncomeTaxOwed = (salaryIncome, interestIncome, dividendIncome, taxYear) => {
  /**
   * Calculates the income tax owed for a given set of income streams. Each
   * band will be 'filled up' in order.
   * 
   * The function returns the overall income tax owed, as well as a breakdown of
   * the income tax owed by band.
   */
  
  // What is the total income?
  const totalIncome = salaryIncome + interestIncome + dividendIncome;

  // What is the personal allowance?
  const personalAllowance = calculatePersonalAllowance(
    totalIncome,
    incomeTax[taxYear].personalAllowance,
    taxYear
  );

  // What is the higher rate threshold?
  const higherBand = incomeTax[taxYear].higherBand;

  // Start tranches
  const tranches = [];
  let cumulative = 0;
  let remainingPersonalAllowance = personalAllowance;
  let remainingSalaryIncome = salaryIncome;
  let remainingInterestIncome = interestIncome;
  let remainingDividendIncome = dividendIncome;
  let region = 0;

  // Salary personal allowance
  const salaryPersonalAllowance = Math.max(Math.min(remainingSalaryIncome, remainingPersonalAllowance), 0);
  if (salaryPersonalAllowance) {
    tranches.push({
      type: "salary",
      rate: 0,
      region: 0,
      amount: salaryPersonalAllowance,
    });
    cumulative += salaryPersonalAllowance;
    remainingSalaryIncome -= salaryPersonalAllowance;
    remainingPersonalAllowance -= salaryPersonalAllowance;
  }

  // Salary basic rate
  const salaryBasicRate = Math.max(Math.min(remainingSalaryIncome, higherBand), 0);
  if (salaryBasicRate) {
    tranches.push({
      type: "salary",
      rate: salaryIncomeTax[taxYear].basic,
      region: 1,
      amount: salaryBasicRate,
    });
    cumulative += salaryBasicRate;
    remainingSalaryIncome -= salaryBasicRate;
    region = 1;
  }

  // Salary higher rate
  const salaryHigherRate = Math.max(Math.min(remainingSalaryIncome, incomeTax[taxYear].additionalBand - higherBand), 0);
  if (salaryHigherRate) {
    tranches.push({
      type: "salary",
      rate: salaryIncomeTax[taxYear].higher,
      region: 2,
      amount: salaryHigherRate,
    });
    cumulative += salaryHigherRate;
    remainingSalaryIncome -= salaryHigherRate;
    region = 2;
  }

  // Salary additional rate
  const salaryAdditionalRate = Math.max(remainingSalaryIncome, 0);
  if (salaryAdditionalRate) {
    tranches.push({
      type: "salary",
      rate: salaryIncomeTax[taxYear].additional,
      region: 3,
      amount: salaryAdditionalRate,
    });
    cumulative += salaryAdditionalRate;
    remainingSalaryIncome -= salaryAdditionalRate;
    region = 3;
  }

  // What is the savings allowance?
  let savingsAllowance = 0;
  if (totalIncome <= (personalAllowance + incomeTax[taxYear].higherBand)) {
    savingsAllowance = 1000;
  } else if (totalIncome <= incomeTax[taxYear].additionalBand) {
    savingsAllowance = 500;
  }

  // What is the starting rate threshold for savings?
  const nonInterestIncome = salaryIncome + dividendIncome;
  let startingRateThreshold = 0;
  if (nonInterestIncome <= personalAllowance + 5000) {
    startingRateThreshold = 5000 - Math.max((nonInterestIncome - personalAllowance), 0);
  }

  // Add the personal allowance
  let nextThreshold = {
    0: personalAllowance,
    1: higherBand + personalAllowance,
    2: incomeTax[taxYear].additionalBand,
    3: Infinity,
  }[region];
  const savingsPersonalAllowanceAmount = Math.max(Math.min(remainingPersonalAllowance, remainingInterestIncome), 0);
  if (savingsPersonalAllowanceAmount) {
    if (savingsPersonalAllowanceAmount + cumulative >= nextThreshold) {
      tranches.push({
        type: "interest",
        rate: 0,
        region: region,
        amount: nextThreshold - cumulative,
      });
      region += 1;
      if (savingsPersonalAllowanceAmount - (nextThreshold - cumulative) > 0) {
        tranches.push({
          type: "interest",
          rate: 0,
          region: region,
          amount: savingsPersonalAllowanceAmount - (nextThreshold - cumulative),
        });
      }
    } else {
      tranches.push({
        type: "interest",
        rate: 0,
        region: region,
        amount: savingsPersonalAllowanceAmount,
      });
    }
    cumulative += savingsPersonalAllowanceAmount;
    remainingInterestIncome -= savingsPersonalAllowanceAmount;
    remainingPersonalAllowance -= savingsPersonalAllowanceAmount;
  }
  
  // Add the savings allowance
  nextThreshold = {
    0: personalAllowance,
    1: higherBand + personalAllowance,
    2: incomeTax[taxYear].additionalBand,
    3: Infinity,
  }[region];
  const savingsAllowanceAmount = Math.max(Math.min(savingsAllowance, remainingInterestIncome), 0);
  if (savingsAllowanceAmount) {
    if (savingsAllowanceAmount + cumulative >= nextThreshold) {
      if (nextThreshold - cumulative > 0) {
        tranches.push({
          type: "interest",
          rate: 0,
          region: region,
          amount: nextThreshold - cumulative,
        });
      }
      region += 1;
      if (savingsAllowanceAmount - (nextThreshold - cumulative) > 0) {
        tranches.push({
          type: "interest",
          rate: 0,
          region: region,
          amount: savingsAllowanceAmount - (nextThreshold - cumulative),
        });
      }
    } else {
      tranches.push({
        type: "interest",
        rate: 0,
        region: region,
        amount: savingsAllowanceAmount,
      });
    }
    cumulative += savingsAllowanceAmount;
    remainingInterestIncome -= savingsAllowanceAmount;
  }

  // Add the starting rate threshold
  nextThreshold = {
    0: personalAllowance,
    1: higherBand + personalAllowance,
    2: incomeTax[taxYear].additionalBand,
    3: Infinity,
  }[region];
  const startingRateThresholdAmount = Math.max(Math.min(startingRateThreshold, remainingInterestIncome), 0);
  if (startingRateThresholdAmount) {
    if (startingRateThresholdAmount + cumulative >= nextThreshold) {
      if (nextThreshold - cumulative > 0) {
        tranches.push({
          type: "interest",
          rate: 0,
          region: region,
          amount: nextThreshold - cumulative,
        });
      }
      region += 1;
      if (startingRateThresholdAmount - (nextThreshold - cumulative) > 0) {
        tranches.push({
          type: "interest",
          rate: 0,
          region: region,
          amount: startingRateThresholdAmount - (nextThreshold - cumulative),
        });
      }
    } else {
      tranches.push({
        type: "interest",
        rate: 0,
        region: region,
        amount: startingRateThresholdAmount,
      });
    }
    cumulative += startingRateThresholdAmount;
    remainingInterestIncome -= startingRateThresholdAmount;
  }

  // Add the basic rate interest
  nextThreshold = {
    0: personalAllowance,
    1: higherBand + personalAllowance,
    2: incomeTax[taxYear].additionalBand,
    3: Infinity,
  }[region];
  if (remainingInterestIncome) {
    const basicRateInterest = Math.max(Math.min(remainingInterestIncome, higherBand + personalAllowance - cumulative), 0);

    if (basicRateInterest) {
      if (basicRateInterest + cumulative >= nextThreshold) {
        tranches.push({
          type: "interest",
          rate: salaryIncomeTax[taxYear].basic,
          region: region,
          amount: nextThreshold - cumulative,
        });
        region += 1;
        if (basicRateInterest - (nextThreshold - cumulative) > 0) {
          tranches.push({
            type: "interest",
            rate: salaryIncomeTax[taxYear].higher,
            region: region,
            amount: basicRateInterest - (nextThreshold - cumulative),
          });
        }
      } else {
        tranches.push({
          type: "interest",
          rate: salaryIncomeTax[taxYear].basic,
          region: region,
          amount: basicRateInterest,
        });
      }
      cumulative += basicRateInterest;
      remainingInterestIncome -= basicRateInterest;
    }
  }

  // Add the higher rate interest
  nextThreshold = {
    0: personalAllowance,
    1: higherBand + personalAllowance,
    2: incomeTax[taxYear].additionalBand,
    3: Infinity,
  }[region];
  if (remainingInterestIncome) {
    const higherRateInterest = Math.max(Math.min(remainingInterestIncome, incomeTax[taxYear].additionalBand - cumulative), 0);
    if (higherRateInterest) {
      if (higherRateInterest + cumulative >= nextThreshold) {
        tranches.push({
          type: "interest",
          rate: salaryIncomeTax[taxYear].higher,
          region: region,
          amount: nextThreshold - cumulative,
        });
        region += 1;
        if (higherRateInterest - (nextThreshold - cumulative) > 0) {
          tranches.push({
            type: "interest",
            rate: salaryIncomeTax[taxYear].additional,
            region: region,
            amount: higherRateInterest - (nextThreshold - cumulative),
          });
        }
      } else {
        tranches.push({
          type: "interest",
          rate: salaryIncomeTax[taxYear].higher,
          region: region,
          amount: higherRateInterest,
        });
      }
      cumulative += higherRateInterest;
      remainingInterestIncome -= higherRateInterest;
    }
  }

  // Add the additional rate interest
  nextThreshold = {
    0: personalAllowance,
    1: higherBand + personalAllowance,
    2: incomeTax[taxYear].additionalBand,
    3: Infinity,
  }[region];
  if (remainingInterestIncome) {
    const additionalRateInterest = Math.max(remainingInterestIncome, 0);
    if (additionalRateInterest) {
      tranches.push({
        type: "interest",
        rate: salaryIncomeTax[taxYear].additional,
        region: region,
        amount: additionalRateInterest,
      });
      cumulative += additionalRateInterest;
      remainingInterestIncome -= additionalRateInterest;
    }
  }

  // Add the dividend personal allowance
  nextThreshold = {
    0: personalAllowance,
    1: higherBand + personalAllowance,
    2: incomeTax[taxYear].additionalBand,
    3: Infinity,
  }[region];
  const dividendPersonalAllowanceAmount = Math.max(Math.min(remainingPersonalAllowance, remainingDividendIncome), 0);
  if (dividendPersonalAllowanceAmount) {
    if (dividendPersonalAllowanceAmount + cumulative >= nextThreshold) {
      tranches.push({
        type: "dividend",
        rate: 0,
        region: region,
        amount: nextThreshold - cumulative,
      });
      region += 1;
      if (dividendPersonalAllowanceAmount - (nextThreshold - cumulative) > 0) {
        tranches.push({
          type: "dividend",
          rate: 0,
          region: region,
          amount: dividendPersonalAllowanceAmount - (nextThreshold - cumulative),
        });
      }
    } else {
      tranches.push({
        type: "dividend",
        rate: 0,
        region: region,
        amount: dividendPersonalAllowanceAmount,
      });
    }
    cumulative += dividendPersonalAllowanceAmount;
    remainingDividendIncome -= dividendPersonalAllowanceAmount;
    remainingPersonalAllowance -= dividendPersonalAllowanceAmount;
  }

  // Add the dividend allowance
  nextThreshold = {
    0: personalAllowance,
    1: higherBand + personalAllowance,
    2: incomeTax[taxYear].additionalBand,
    3: Infinity,
  }[region];
  const dividendAllowanceAmount = Math.max(Math.min(dividendAllowance[taxYear], remainingDividendIncome), 0);
  if (dividendAllowanceAmount) {
    if (dividendAllowanceAmount + cumulative >= nextThreshold) {
      if (nextThreshold - cumulative > 0) {
        tranches.push({
          type: "dividend",
          rate: 0,
          region: region,
          amount: nextThreshold - cumulative,
        });
      }
      region += 1;
      if (dividendAllowanceAmount - (nextThreshold - cumulative) > 0) {
        tranches.push({
          type: "dividend",
          rate: 0,
          region: region,
          amount: dividendAllowanceAmount - (nextThreshold - cumulative),
        });
      }
    } else {
      tranches.push({
        type: "dividend",
        rate: 0,
        region: region,
        amount: dividendAllowanceAmount,
      });
    }
    cumulative += dividendAllowanceAmount;
    remainingDividendIncome -= dividendAllowanceAmount;
  }

  // Add the dividend basic rate
  nextThreshold = {
    0: personalAllowance,
    1: higherBand + personalAllowance,
    2: incomeTax[taxYear].additionalBand,
    3: Infinity,
  }[region];
  if (remainingDividendIncome) {
    const dividendBasicRate = Math.max(Math.min(remainingDividendIncome, higherBand + personalAllowance - cumulative), 0);
    if (dividendBasicRate) {
      if (dividendBasicRate + cumulative >= nextThreshold) {
        if (nextThreshold - cumulative > 0) {
          tranches.push({
            type: "dividend",
            rate: dividendIncomeTax[taxYear].basic,
            region: region,
            amount: nextThreshold - cumulative,
          });
        }
        region += 1;
        if (dividendBasicRate - (nextThreshold - cumulative) > 0) {
          tranches.push({
            type: "dividend",
            rate: dividendIncomeTax[taxYear].higher,
            region: region,
            amount: dividendBasicRate - (nextThreshold - cumulative),
          });
        }
      } else {
        tranches.push({
          type: "dividend",
          rate: dividendIncomeTax[taxYear].basic,
          region: region,
          amount: dividendBasicRate,
        });
      }
      cumulative += dividendBasicRate;
      remainingDividendIncome -= dividendBasicRate;
    }
  }

  // Add the dividend higher rate
  nextThreshold = {
    0: personalAllowance,
    1: higherBand + personalAllowance,
    2: incomeTax[taxYear].additionalBand,
    3: Infinity,
  }[region];
  if (remainingDividendIncome) {
    const dividendHigherRate = Math.max(Math.min(remainingDividendIncome, incomeTax[taxYear].additionalBand - cumulative), 0);
    if (dividendHigherRate) {
      if (dividendHigherRate + cumulative >= nextThreshold) {
        tranches.push({
          type: "dividend",
          rate: dividendIncomeTax[taxYear].higher,
          region: region,
          amount: nextThreshold - cumulative,
        });
        region += 1;
        if (dividendHigherRate - (nextThreshold - cumulative) > 0) {
          tranches.push({
            type: "dividend",
            rate: dividendIncomeTax[taxYear].additional,
            region: region,
            amount: dividendHigherRate - (nextThreshold - cumulative),
          });
        }
      } else {
        tranches.push({
          type: "dividend",
          rate: dividendIncomeTax[taxYear].higher,
          region: region,
          amount: dividendHigherRate,
        });
      }
      cumulative += dividendHigherRate;
      remainingDividendIncome -= dividendHigherRate;
    }
  }

  // Add the dividend additional rate
  nextThreshold = {
    0: personalAllowance,
    1: higherBand + personalAllowance,
    2: incomeTax[taxYear].additionalBand,
    3: Infinity,
  }[region];
  if (remainingDividendIncome) {
    const dividendAdditionalRate = Math.max(remainingDividendIncome, 0);
    if (dividendAdditionalRate) {
      tranches.push({
        type: "dividend",
        rate: dividendIncomeTax[taxYear].additional,
        region: region,
        amount: dividendAdditionalRate,
      });
      cumulative += dividendAdditionalRate;
      remainingDividendIncome -= dividendAdditionalRate;
    }
  }


  
  
  
  
  
  
  
  
  /* 
  

  // Add the starting rate threshold
  

  // Add the basic rate interest
  if (cumulative < higherBand + personalAllowance) {
    const basicRateInterest = Math.min(remainingInterestIncome, higherBand + personalAllowance - cumulative);
    if (basicRateInterest) {
      if (basicRateInterest + cumulative > higherBand + personalAllowance) {
        tranches.push({
          type: "interest",
          rate: salaryIncomeTax[taxYear].basic,
          region: region,
          amount: higherBand + personalAllowance - cumulative,
        });
        region += 1;
        tranches.push({
          type: "interest",
          rate: salaryIncomeTax[taxYear].higher,
          region: region + 1,
          amount: basicRateInterest - (higherBand + personalAllowance - cumulative),
        });
      } else {
        tranches.push({
          type: "interest",
          rate: salaryIncomeTax[taxYear].basic,
          region: region,
          amount: basicRateInterest,
        });
      }
      cumulative += basicRateInterest;
      remainingInterestIncome -= basicRateInterest;
    }
  }

  // Add the higher rate interest
  if (cumulative < incomeTax[taxYear].additionalBand) {
    const higherRateInterest = Math.min(remainingInterestIncome, incomeTax[taxYear].additionalBand - cumulative);
    if (higherRateInterest) {
      if (higherRateInterest + cumulative > incomeTax[taxYear].additionalBand) {
        tranches.push({
          type: "interest",
          rate: salaryIncomeTax[taxYear].higher,
          region: region,
          amount: incomeTax[taxYear].additionalBand - cumulative,
        });
        region += 1;
        tranches.push({
          type: "interest",
          rate: salaryIncomeTax[taxYear].additional,
          region: region + 1,
          amount: higherRateInterest - (incomeTax[taxYear].additionalBand - cumulative),
        });
      } else {
        tranches.push({
          type: "interest",
          rate: salaryIncomeTax[taxYear].higher,
          region: region,
          amount: higherRateInterest,
        });
      }
      cumulative += higherRateInterest;
      remainingInterestIncome -= higherRateInterest;
    }
  }

  // Add the additional rate interest
  if (cumulative < Infinity) {
    const additionalRateInterest = Math.max(remainingInterestIncome, 0);
    if (additionalRateInterest) {
      tranches.push({
        type: "interest",
        rate: salaryIncomeTax[taxYear].additional,
        region: region,
        amount: additionalRateInterest,
      });
      cumulative += additionalRateInterest;
      remainingInterestIncome -= additionalRateInterest;
    }
  }

  // Add the dividend personal allowance
  const dividendPersonalAllowance = Math.min(dividendAllowance[taxYear], remainingDividendIncome);
  if (dividendPersonalAllowance) {
    tranches.push({
      type: "dividend",
      rate: 0,
      region: region,
      amount: dividendPersonalAllowance,
    });
    cumulative += dividendPersonalAllowance;
    remainingDividendIncome -= dividendPersonalAllowance;
  }

  // Add the dividend basic rate
  if (cumulative < higherBand + personalAllowance) {
    const dividendBasicRate = Math.min(remainingDividendIncome, higherBand + personalAllowance - cumulative);
    if (dividendBasicRate) {
      if (dividendBasicRate + cumulative > higherBand + personalAllowance) {
        tranches.push({
          type: "dividend",
          rate: dividendIncomeTax[taxYear].basic,
          region: region,
          amount: higherBand + personalAllowance - cumulative,
        });
        region += 1;
        tranches.push({
          type: "dividend",
          rate: dividendIncomeTax[taxYear].higher,
          region: region + 1,
          amount: dividendBasicRate - (higherBand + personalAllowance - cumulative),
        });
      } else {
        tranches.push({
          type: "dividend",
          rate: dividendIncomeTax[taxYear].basic,
          region: region,
          amount: dividendBasicRate,
        });
      }
      cumulative += dividendBasicRate;
      remainingDividendIncome -= dividendBasicRate;
    }
  }

  // Add the dividend higher rate
  if (cumulative < incomeTax[taxYear].additionalBand) {
    const dividendHigherRate = Math.min(remainingDividendIncome, incomeTax[taxYear].additionalBand - cumulative);
    if (dividendHigherRate) {
      if (dividendHigherRate + cumulative > incomeTax[taxYear].additionalBand) {
        tranches.push({
          type: "dividend",
          rate: dividendIncomeTax[taxYear].higher,
          region: region,
          amount: incomeTax[taxYear].additionalBand - cumulative,
        });
        region += 1;
        tranches.push({
          type: "dividend",
          rate: dividendIncomeTax[taxYear].additional,
          region: region + 1,
          amount: dividendHigherRate - (incomeTax[taxYear].additionalBand - cumulative),
        });
      } else {
        tranches.push({
          type: "dividend",
          rate: dividendIncomeTax[taxYear].higher,
          region: region,
          amount: dividendHigherRate,
        });
      }
      cumulative += dividendHigherRate;
      remainingDividendIncome -= dividendHigherRate;
    }
  }

  // Add the dividend additional rate
  if (cumulative < Infinity) {
    const dividendAdditionalRate = Math.max(remainingDividendIncome, 0);
    if (dividendAdditionalRate) {
      tranches.push({
        type: "dividend",
        rate: dividendIncomeTax[taxYear].additional,
        region: region,
        amount: dividendAdditionalRate,
      });
      cumulative += dividendAdditionalRate;
      remainingDividendIncome -= dividendAdditionalRate;
    }
  } */

  // How much income tax is owed?
  const owed = Math.round(tranches.reduce((a, b) => a + b.amount * b.rate, 0) * 100) / 100;

  return [owed, tranches];
}


export const calculateStudentLoanOwed = (totalIncome, taxYear) => {
  /**
   * Calculates the student loan deduction for a given total income.
   */

  const studentLoanData = studentLoan[taxYear];
  const applicable = Math.max(totalIncome - studentLoanData.threshold, 0);
  const owed = applicable * studentLoanData.rate;
  return Math.round(owed * 100) / 100;
}