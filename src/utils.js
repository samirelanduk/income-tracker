import { incomeTax, studentLoan, salaryIncomeTax, dividendIncomeTax, dividendAllowance, nationalInsurance } from "./hmrc";

export const dateToTaxYear = (date, monthStart) => {
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
  return amount.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

export const formatDate = date => {
  return new Date(date).toLocaleDateString("en-GB");
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


export const annotateSalaryComponents = components => {
  const companies = [...new Set(components.map(c => c.company))];
  const cumulativeSalaryByCompany = companies.reduce((acc, company) => {
    acc[company] = 0;
    return acc;
  }, {});
  const cumulativeIncomeTaxByCompany = companies.reduce((acc, company) => {
    acc[company] = 0;
    return acc;
  }, {});
  const cumulativeEmployeeNiByCompany = companies.reduce((acc, company) => {
    acc[company] = 0;
    return acc;
  }, {});
  for (const c of components) {
    if (c.future) {
      if (c.incomeTax === undefined) {
        c.incomeTax = predictIncomeTax(cumulativeSalaryByCompany[c.company] + c.amount, c.date, cumulativeIncomeTaxByCompany[c.company]);
      } else {
        c.incomeTax = c.incomeTax || 0;
      }
      if (c.employeeNI === undefined) {
        if (c.cumulativeNi) {
          c.employeeNI = predictDirectorsEmployeeNi(cumulativeSalaryByCompany[c.company] + c.amount, c.date, cumulativeEmployeeNiByCompany[c.company]);
        } else {
          c.employeeNI = predictEmployeeNI(c.amount, c.date);
        }
      } else {
        c.employeeNI = c.employeeNI || 0;
      }
      if (c.studentLoan === undefined) {
        c.studentLoan = predictStudentLoan(c.amount, c.date);
      } else {
        c.studentLoan = c.studentLoan || 0;
      }
      c.employerNI = c.employerNI || 0;
      c.grossIncome = c.amount;
      c.net = c.amount - c.incomeTax - c.employeeNI - c.studentLoan;
    } else {
      c.incomeTax = c.incomeTax || 0;
      c.employeeNI = c.employeeNI || 0;
      c.studentLoan = c.studentLoan || 0;
      c.net = c.amount;
      c.grossIncome = c.amount + c.incomeTax + c.employeeNI + c.studentLoan;
    }
    cumulativeSalaryByCompany[c.company] += c.grossIncome;
    cumulativeIncomeTaxByCompany[c.company] += c.incomeTax;
    cumulativeEmployeeNiByCompany[c.company] += c.employeeNI;
  }
};

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
  const annualPersonalAllowance = calculatePersonalAllowance(salaryIncomeTaxData.personalAllowance + 9, taxYear);

  // What are the thresholds for this point in the year?
  const personalAllowance = annualPersonalAllowance / 12 * monthNumber;
  const higherBand = incomeTaxData.higherBand / 12 * monthNumber;
  const additionalBand = incomeTaxData.additionalBand / 12 * monthNumber;

  // How much income is taxable?
  const taxableIncome = Math.max(salaryToDate - personalAllowance, 0);


  if (taxableIncome <= higherBand) {
    return taxableIncome * salaryIncomeTaxData.basic - incomeTaxToDate;
  }
  if (taxableIncome <= additionalBand) {
    return (
      (higherBand * salaryIncomeTaxData.basic) +
      (taxableIncome - higherBand) * salaryIncomeTaxData.higher
    ) - incomeTaxToDate;
  }
  return (
    (higherBand * salaryIncomeTaxData.basic) +
    (additionalBand - higherBand) * salaryIncomeTaxData.higher +
    (taxableIncome - additionalBand) * salaryIncomeTaxData.additional
  ) - incomeTaxToDate;
  
  




  /* const incomeTaxData = incomeTax[taxYear];
  const salaryIncomeTaxData = salaryIncomeTax[taxYear];
  const personalAllowance = calculatePersonalAllowance(totalIncome, taxYear);
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
  ); */
}

const predictEmployeeNI = (amount, date) => {
  const taxYear = dateToTaxYear(date);
  const niData = nationalInsurance[taxYear];
  const dates = Object.keys(niData);
  const mostRecentDateToDate = dates.filter(d => new Date(d) <= new Date(date)).sort().reverse()[0];
  const mostRecentData = niData[mostRecentDateToDate];
  const pt = mostRecentData.pt / 12;
  const uel = mostRecentData.uel / 12;
  if (amount <= pt) return 0;
  if (amount <= uel) return (amount - pt) * mostRecentData.employeeRate1;
  return (uel - pt) * mostRecentData.employeeRate1 + (amount - uel) * mostRecentData.employeeRate2;
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
  return owedForYear - employeeNIToDate;
}

const predictStudentLoan = (amount, date) => {
  const taxYear = dateToTaxYear(date);
  const studentLoanData = studentLoan[taxYear];
  const threshold = studentLoanData.threshold / 12;
  const rate = studentLoanData.rate;
  return parseInt(Math.max(amount - threshold, 0) * rate);
}