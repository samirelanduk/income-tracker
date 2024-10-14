import React from "react";
import PropTypes from "prop-types";
import { data } from "./data";
import { dateToTaxYear, formatCurrency } from "./utils";
import { calculateSalaryIncomeTaxOwed, calculateDividendIncomeTaxOwed } from "./utils";

const IncomeTax = props => {

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

  let paye = 0;
  let totalSalaryIncome = 0;
  const payeByCompany = data.reduce((acc, c) => {
    return {...acc, [c.name]: 0};
  }, {});
  for (const c of salaryComponents) {
    const incomeTax = c.incomeTax || 0;
    const employeeNI = c.employeeNI || 0;
    const studentLoan = c.studentLoan || 0;
    const grossIncome = c.amount + incomeTax + employeeNI + studentLoan;
    totalSalaryIncome += grossIncome;
    paye += incomeTax;
    payeByCompany[c.company] += incomeTax;
  }

  const totalDividendIncome = dividendComponents.reduce((acc, c) => acc + c.amount, 0);
  const totalIncome = totalSalaryIncome + totalDividendIncome;
  const salaryIncomeTaxOwed = calculateSalaryIncomeTaxOwed(totalIncome, totalSalaryIncome, taxYear);
  const dividendIncomeTaxOwed = calculateDividendIncomeTaxOwed(totalIncome, totalDividendIncome, taxYear);
  const incomeTaxOwed = salaryIncomeTaxOwed + dividendIncomeTaxOwed;
  const hmrcBill = incomeTaxOwed - paye;



  return (
    <div>
      <div>Income Tax</div>
      <div>Paid through PAYE: {formatCurrency(paye)}</div>
      {data.map(c => (
        <div key={c.name} className="ml-8">
          <span className="size-3 rounded-full inline-block mr-1" style={{backgroundColor: c.color}} />
          {c.name}: {formatCurrency(payeByCompany[c.name])}
        </div>
      ))}
      <div>Total income tax owed: {formatCurrency(incomeTaxOwed)}</div>
      <div>Salary income tax owed: {formatCurrency(salaryIncomeTaxOwed)}</div>
      <div>Dividend income tax owed: {formatCurrency(dividendIncomeTaxOwed)}</div>
      <div>HMRC Bill: {formatCurrency(hmrcBill)}</div>
    </div>
  );
};

IncomeTax.propTypes = {
  taxYear: PropTypes.number.isRequired,
};

export default IncomeTax;