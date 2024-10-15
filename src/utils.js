import { incomeTax, studentLoan, salaryIncomeTax, dividendIncomeTax, dividendAllowance } from "./hmrc";

export const dateToTaxYear = (date, monthStart=4) => {
  const year = parseInt(date.split("-")[0]);
  const month = parseInt(date.split("-")[1]);
  return month < monthStart ? year - 1 : year;
}

export const formatCurrency = amount => {
  return amount.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

export const formatDate = date => {
  return new Date(date).toLocaleDateString("en-GB");
}

export const calculatePersonalAllowance = (totalIncome, taxYear) => {
  const incomeTaxData = incomeTax[taxYear];
  return totalIncome <= incomeTaxData.personalAllowanceThreshold ? (
    incomeTaxData.personalAllowance
  ) : Math.max(incomeTaxData.personalAllowance - (
    totalIncome - incomeTaxData.personalAllowanceThreshold
  ) / 2, 0);
}

export const calculateSalaryIncomeTaxOwed = (totalIncome, salaryIncome, taxYear) => {
  const incomeTaxData = incomeTax[taxYear];
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
  );
} 

export const calculateDividendIncomeTaxOwed = (totalIncome, dividendIncome, taxYear) => {
  const salaryIncome = totalIncome - dividendIncome;
  const incomeTaxData = incomeTax[taxYear];
  const dividendIncomeTaxData = dividendIncomeTax[taxYear];
  const dividends = Math.max(dividendIncome - dividendAllowance[taxYear], 0);
  let personalAllowance = calculatePersonalAllowance(totalIncome, taxYear);
  personalAllowance = Math.max(personalAllowance - salaryIncome, 0);
  const higherBand = Math.max(incomeTaxData.higherBand - salaryIncome, 0);
  const additionalBand = Math.max(incomeTaxData.additionalBand - salaryIncome, 0);
  const taxableIncome = Math.max(dividends - personalAllowance, 0);
  if (taxableIncome === 0) return 0;
  if (taxableIncome <= higherBand) {
    return taxableIncome * dividendIncomeTaxData.basic;
  }
  if (taxableIncome <= additionalBand) {
    return (
      (higherBand * dividendIncomeTaxData.basic) +
      (taxableIncome - higherBand) * dividendIncomeTaxData.higher
    );
  }
  return (
    (incomeTaxData.higherBand * dividendIncomeTaxData.basic) +
    (incomeTaxData.additionalBand - incomeTaxData.higherBand) * dividendIncomeTaxData.higher +
    (taxableIncome - incomeTaxData.additionalBand) * dividendIncomeTaxData.additional
  );
}

export const calculateStudentLoanOwed = (totalIncome, taxYear) => {
  const studentLoanData = studentLoan[taxYear];
  return Math.max(totalIncome - studentLoanData.threshold, 0) * studentLoanData.rate;
}