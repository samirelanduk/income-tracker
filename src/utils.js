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

export const calculateSalaryIncomeTaxOwed = (totalIncome, salaryIncome, taxYear) => {

} 