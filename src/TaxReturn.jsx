import React from "react";
import PropTypes from "prop-types";
import { data, taxReturns, hmrcPayments } from "./data";
import { studentLoan } from "./hmrc";
import { calculateDividendIncomeTaxOwed, calculateSalaryIncomeTaxOwed, dateToTaxYear, formatCurrency, formatDate } from "./utils";

const TaxReturn = props => {

  const { taxYear } = props;

  const allTransactions = data.flatMap(c => c.transactions.map(t => ({...t, company: c.name})));
  const components = allTransactions.filter(t => t.components).map(
    t => t.components.map(c => ({...c, company: t.company, date: t.date}))
  ).flat();

  const salaryComponents = components.filter(c => c.type === "salary").filter(
    c => dateToTaxYear(c.personalDate || c.date) === taxYear
  )
  const dividendComponents = components.filter(c => c.type === "dividend").filter(
    c => dateToTaxYear(c.personalDate || c.date) === taxYear
  );

  let totalSalaryIncome = 0;
  for (const c of salaryComponents) {
    const incomeTax = c.incomeTax || 0;
    const employeeNI = c.employeeNI || 0;
    const studentLoan = c.studentLoan || 0;
    const grossIncome = c.amount + incomeTax + employeeNI + studentLoan;
    totalSalaryIncome += grossIncome;
  }

  const totalDividendIncome = dividendComponents.reduce((acc, c) => acc + c.amount, 0);

  const totalIncome = totalSalaryIncome + totalDividendIncome;



  const taxReturn = taxReturns.find(t => t.taxYear === taxYear);

  const salaryIncomeTaxOwed = calculateSalaryIncomeTaxOwed(totalIncome, totalSalaryIncome, taxYear);
  const dividendIncomeTaxOwed = calculateDividendIncomeTaxOwed(totalIncome, totalDividendIncome, taxYear);
  const incomeTaxOwed = salaryIncomeTaxOwed + dividendIncomeTaxOwed;

  const studentLoanData = studentLoan[taxYear];
  const studentLoanIncome = Math.max(totalIncome - studentLoanData.threshold, 0);
  const studentLoanOwed = studentLoanIncome * studentLoanData.rate;

  const totalOwed = taxReturn ? taxReturn.incomeTax + taxReturn.studentLoan : studentLoanOwed;

  const hmrcPaymentsForYear = hmrcPayments.filter(p => p.taxYear === taxYear);
  const hasPayments = hmrcPaymentsForYear.length > 0;
  const totalPaymentsMade = hmrcPaymentsForYear.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div>
      <div className="text-lg">HMRC Owed: {formatCurrency(totalOwed)}</div>
      <div className="text-base ml-8">Income tax: {formatCurrency(taxReturn ? taxReturn.incomeTax : incomeTaxOwed)}</div>
      {taxReturn && (
        <div className="ml-8 text-xs">Predicted: {formatCurrency(incomeTaxOwed)}</div>
      )}
      <div className="text-base ml-8">Student loan: {formatCurrency(taxReturn ? taxReturn.studentLoan : studentLoanOwed)}</div>
      {taxReturn && (
        <div className="ml-8 text-xs">Predicted: {formatCurrency(studentLoanOwed)}</div>
      )}
      {hasPayments && (
        <>
          <div className="text-lg">HMRC Payments: {formatCurrency(hmrcPaymentsForYear.reduce((acc, p) => acc + p.amount, 0))}</div>
          {hmrcPaymentsForYear.map(p => (
            <div key={p.date} className="text-base ml-8">
              {formatDate(p.date)}: {formatCurrency(p.amount)}
            </div>
          ))}
        </>
      )}
      <div className="text-lg">Oustanding: {formatCurrency(totalOwed - totalPaymentsMade)}</div>
    </div>
  );
};

TaxReturn.propTypes = {
  taxYear: PropTypes.number.isRequired,
};

export default TaxReturn;