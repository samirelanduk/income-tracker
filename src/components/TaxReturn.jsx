import React from "react";
import PropTypes from "prop-types";
import { data, taxReturns, hmrcPayments } from "../data";
import { studentLoan } from "../hmrc";
import { calculateDividendIncomeTaxOwed, calculateSalaryIncomeTaxOwed, dateToTaxYear, calculateStudentLoanOwed, formatCurrency, formatDate, annotateSalaryComponents } from "../utils";

const TaxReturn = props => {

  const { taxYear, useFuture } = props;

  const allTransactions = data.flatMap(c => c.transactions.map(t => ({...t, company: c.name})));
  const components = allTransactions.filter(t => t.components).map(
    t => t.components.map(c => ({...c, company: t.company, date: t.date, future: t.future}))
  ).flat();
  const salaryComponents = components.filter(c => c.type === "salary").filter(
    c => dateToTaxYear(c.personalDate || c.date) === taxYear && (useFuture || !c.future)
  )
  annotateSalaryComponents(salaryComponents);
  const dividendComponents = components.filter(c => c.type === "dividend").filter(
    c => dateToTaxYear(c.personalDate || c.date) === taxYear && (useFuture || !c.future)
  );
  const interestComponents = components.filter(c => c.type === "interest").filter(
    c => dateToTaxYear(c.personalDate || c.date) === taxYear && (useFuture || !c.future)
  );

  let payeIT = 0;
  let payeSL = 0;
  let totalSalaryIncome = 0;
  const payeITByCompany = data.reduce((acc, c) => {
    return {...acc, [c.name]: 0};
  }, {});
  const payeSLByCompany = data.reduce((acc, c) => {
    return {...acc, [c.name]: 0};
  }, {});
  for (const c of salaryComponents) {
    totalSalaryIncome += c.grossIncome;
    payeIT += c.incomeTax;
    payeSL += c.studentLoan;
    payeITByCompany[c.company] += c.incomeTax;
    payeSLByCompany[c.company] += c.studentLoan;
  }

  const totalDividendIncome = dividendComponents.reduce((acc, c) => acc + c.amount, 0);
  const totalInterestIncome = interestComponents.reduce((acc, c) => acc + c.amount, 0);
  const totalIncome = totalSalaryIncome + totalDividendIncome + totalInterestIncome;
  
  const salaryIncomeTaxOwed = calculateSalaryIncomeTaxOwed(totalIncome, totalSalaryIncome, taxYear);
  const dividendIncomeTaxOwed = calculateDividendIncomeTaxOwed(totalIncome, totalDividendIncome, taxYear);
  const incomeTaxOwed = salaryIncomeTaxOwed + dividendIncomeTaxOwed;
  const incomeTaxHmrc = incomeTaxOwed - payeIT;


  const studentLoanOwed = calculateStudentLoanOwed(totalIncome, taxYear);
  const studentLoanHmrc = parseInt(studentLoanOwed - payeSL);

  const hmrcBillPredicted = incomeTaxHmrc + studentLoanHmrc;

  const taxReturn = taxReturns.find(t => t.taxYear === taxYear);
  const taxReturnTotal = taxReturn ? taxReturn.incomeTax + taxReturn.studentLoan : hmrcBillPredicted;

  const hmrcPaymentsForYear = hmrcPayments.filter(p => p.taxYear === taxYear);
  const hasPayments = hmrcPaymentsForYear.length > 0;
  const totalPaymentsMade = hmrcPaymentsForYear.reduce((acc, p) => acc + p.amount, 0);

  const outstanding = (taxReturn ? taxReturnTotal : hmrcBillPredicted) - totalPaymentsMade;

  const yearIsOver = new Date() > new Date(taxYear + 1, 3, 5);

  const headingClass = "text-xs leading-3 font-bold text-slate-500 mb-0.5";

  return (
    <div className={`${props.className || ""}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-medium text-slate-500">
            Tax Return
            {!taxReturn && " (predicted)"}
          </div>
          <div className="text-2xl font-medium">
            <div>{formatCurrency(taxReturn ? taxReturnTotal : hmrcBillPredicted)}</div>
            {taxReturn && (
              <div className="text-xs">Predicted: {formatCurrency(hmrcBillPredicted)}</div>
            )}
          </div>
        </div>
        {outstanding === 0 && yearIsOver && (
          <div className="bg-green-100 border-green-600 text-green-700 border-2 px-2 rounded font-semibold py-0 mt-1">Paid</div>
        )}
        {outstanding !== 0 && yearIsOver && (
          <div className="bg-red-100 border-red-600 text-red-700 border px-2 rounded font-medium mt-1">
            {outstanding > 0 ? "Owe" : "Owed"} {formatCurrency(Math.abs(outstanding))}
          </div>
        )}
      </div>

      <div className="flex gap-x-6">
        <div>
          <div className={headingClass}>Income Tax</div>
          <div className="font-medium">{formatCurrency(taxReturn ? taxReturn.incomeTax : incomeTaxHmrc)}</div>
          {taxReturn && (
            <div className="text-xs font-medium">Predicted: {formatCurrency(incomeTaxHmrc)}</div>
          )}
        </div>
        <div>
          <div className={headingClass}>Student Loan</div>
          <div className="font-medium">{formatCurrency(taxReturn ? taxReturn.studentLoan : studentLoanHmrc)}</div>
          {taxReturn && (
            <div className="text-xs font-medium">Predicted: {formatCurrency(studentLoanHmrc)}</div>
          )}
        </div>
        {hasPayments && (
          <div>
            <div className={headingClass}>HMRC Payments</div>
            <div className="flex flex-col gap-px">
              {hmrcPaymentsForYear.map(p => (
                <div key={p.date} className="text-xs font-medium">
                  {formatDate(p.date)}: {formatCurrency(p.amount)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

TaxReturn.propTypes = {
  taxYear: PropTypes.number.isRequired,
};

export default TaxReturn;