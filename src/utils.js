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
          cumulative[personalTaxYear] = {income: 0, incomeTax: 0, employeeNi: 0};
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



export const calculatePersonalAllowance = (totalIncome, defaultPersonalAllowance) => {
  return totalIncome <= defaultPersonalAllowance ? (
    defaultPersonalAllowance
  ) : Math.max(defaultPersonalAllowance - (
    totalIncome - defaultPersonalAllowance
  ) / 2, 0);
}

export const calculateSalaryIncomeTaxOwed = (totalIncome, salaryIncome, taxYear) => {
  const incomeTaxData = incomeTax[taxYear];
  const salaryIncomeTaxData = salaryIncomeTax[taxYear];
  const personalAllowance = calculatePersonalAllowance(totalIncome, incomeTaxData.personalAllowance);
  const taxableIncome = Math.max(salaryIncome - personalAllowance, 0);
  if (taxableIncome === 0) return 0;
  if (taxableIncome <= incomeTaxData.higherBand) {
    return taxableIncome * salaryIncomeTaxData.basic;
  }
  if (taxableIncome <= incomeTaxData.additionalBand) {
    return (
      (incomeTaxData.higherBand * salaryIncomeTaxData.basic) +
      (taxableIncome - incomeTaxData.higherBand) * salaryIncomeTaxData.higher
    );
  }
  return (
    (incomeTaxData.higherBand * salaryIncomeTaxData.basic) +
    (incomeTaxData.additionalBand - incomeTaxData.higherBand) * salaryIncomeTaxData.higher +
    (taxableIncome - incomeTaxData.additionalBand) * salaryIncomeTaxData.additional
  );
} 

export const calculateDividendIncomeTaxOwed = (totalIncome, dividendIncome, taxYear) => {
  const salaryIncome = totalIncome - dividendIncome;
  const incomeTaxData = incomeTax[taxYear];
  const dividendIncomeTaxData = dividendIncomeTax[taxYear];
  const dividends = dividendIncome;
  const allowance = dividendAllowance[taxYear];
  let personalAllowance = calculatePersonalAllowance(totalIncome, incomeTaxData.personalAllowance);
  const salaryOverPersonalAllowance = Math.max(salaryIncome - personalAllowance, 0);
  const higherBand = Math.max(incomeTaxData.higherBand - salaryOverPersonalAllowance, 0);
  const additionalBand = Math.max(incomeTaxData.additionalBand - salaryOverPersonalAllowance, 0);
  personalAllowance = Math.max(personalAllowance - salaryIncome, 0);
  const taxableIncome = Math.max(dividends - personalAllowance, 0);
  let taxableAtBasic = 0;
  let taxableAtHigher = 0;
  let taxableAtAdditional = 0;
  if (taxableIncome <= higherBand) {
    taxableAtBasic = Math.max(taxableIncome - allowance, 0);
    taxableAtHigher = 0;
    taxableAtAdditional = 0;
  } else if (taxableIncome <= additionalBand) {
    taxableAtBasic = higherBand;
    taxableAtHigher = taxableIncome - higherBand;
    taxableAtAdditional = 0;
    if (taxableAtBasic >= allowance) {
      taxableAtBasic -= allowance;
    } else {
      taxableAtHigher -= allowance - taxableAtBasic;
      taxableAtBasic = 0;
    }
  } else {
    taxableAtBasic = higherBand;
    taxableAtHigher = additionalBand - higherBand;
    taxableAtAdditional = taxableIncome - additionalBand;
    if (taxableAtBasic >= allowance) {
      taxableAtBasic -= allowance;
    } else if (taxableAtHigher >= allowance) {
      taxableAtHigher -= allowance - taxableAtBasic;
      taxableAtBasic = 0;
    } else {
      taxableAtAdditional -= allowance - taxableAtBasic - taxableAtHigher;
      taxableAtHigher = 0;
      taxableAtBasic = 0;
    }
  }
  return (
    taxableAtBasic * dividendIncomeTaxData.basic +
    taxableAtHigher * dividendIncomeTaxData.higher +
    taxableAtAdditional * dividendIncomeTaxData.additional
  )
}

export const calculateStudentLoanOwed = (totalIncome, taxYear) => {
  const studentLoanData = studentLoan[taxYear];
  return Math.max(totalIncome - studentLoanData.threshold, 0) * studentLoanData.rate;
}


const predictIncomeTax = (salaryToDate, date, incomeTaxToDate) => {
  const taxYear = dateToTaxYear(date);
  const incomeTaxData = incomeTax[taxYear];
  const salaryIncomeTaxData = salaryIncomeTax[taxYear];




  // What is the month number (April = 1, March = 12)
  const monthIndex = new Date(date).getMonth();
  const year = new Date(date).getFullYear();
  const monthNumber = monthIndex < 3 ? monthIndex + 10 : monthIndex - 2;

  // What is the projected total salary for the year?
  const projectedTotalSalary = salaryToDate / monthNumber * 12;

  // What personal allowance would this imply?
  const annualPersonalAllowance = calculatePersonalAllowance(incomeTaxData.personalAllowance + 9, taxYear);

  // What are the thresholds for this point in the year?
  const personalAllowance = annualPersonalAllowance / 12 * monthNumber;
  const higherBand = incomeTaxData.higherBand / 12 * monthNumber;
  const additionalBand = incomeTaxData.additionalBand / 12 * monthNumber;

  // How much income is taxable?
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
    ) - incomeTaxToDate;
  }

  return Math.round((taxOwed - incomeTaxToDate) * 100) / 100;
  
}

const predictEmployeeNI = (amount, date) => {
  const taxYear = dateToTaxYear(date);
  const niData = nationalInsurance[taxYear];
  const dates = Object.keys(niData);
  const mostRecentDateToDate = dates.filter(d => new Date(d) <= new Date(date)).sort().reverse()[0];
  const mostRecentData = niData[mostRecentDateToDate];
  const pt = mostRecentData.pt / 12;
  const uel = mostRecentData.uel / 12;
  let owed;
  if (amount <= pt) {
    owed = 0;
  } else if (amount <= uel) {
   owed = (amount - pt) * mostRecentData.employeeRate1;
  } else {
    owed = (uel - pt) * mostRecentData.employeeRate1 + (amount - uel) * mostRecentData.employeeRate2;
  }
  return Math.round(owed * 100) / 100;
}

const predictDirectorsEmployeeNi = (salaryToDate, date, employeeNIToDate) => {
  const taxYear = dateToTaxYear(date);
  const niData = nationalInsurance[taxYear];
  const dates = Object.keys(niData);
  const mostRecentDateToDate = dates.filter(d => new Date(d) <= new Date(date)).sort().reverse()[0];
  const mostRecentData = niData[mostRecentDateToDate];
  const pt = mostRecentData.pt;
  const uel = mostRecentData.uel;
  let owedForYear;
  if (salaryToDate < pt) {
    owedForYear = 0;
  } else if (salaryToDate < uel) {
    owedForYear = (salaryToDate - pt) * mostRecentData.employeeRate1;
  } else {
    owedForYear = (uel - pt) * mostRecentData.employeeRate1 + (salaryToDate - uel) * mostRecentData.employeeRate2;
  }
  return Math.round((owedForYear - employeeNIToDate) * 100) / 100;
}

const predictStudentLoan = (amount, date) => {
  const taxYear = dateToTaxYear(date);
  const studentLoanData = studentLoan[taxYear];
  const threshold = studentLoanData.threshold / 12;
  const rate = studentLoanData.rate;
  const owed = parseInt(Math.max(amount - threshold, 0) * rate);
  return Math.round(owed * 100) / 100;
}