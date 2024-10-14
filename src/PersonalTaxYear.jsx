import React from "react";
import PropTypes from "prop-types";
import { data } from "./data";
import { dateToTaxYear, formatCurrency } from "./utils";

const PersonalTaxYear = props => {

  const { taxYear } = props;

  const allTransactions = data.flatMap(c => c.transactions.map(t => ({...t, company: c.name})));
  const transactions = allTransactions.filter(t => dateToTaxYear(t.date) === taxYear);
  const components = transactions.filter(t => t.components).map(t => t.components.map(c => ({...c, company: t.company}))).flat();

  const salaryComponents = components.filter(c => c.type === "salary");
  const dividendComponents = components.filter(c => c.type === "dividend");

  let totalSalaryIncome = 0;
  const salaryIncomeByCompany = data.reduce((acc, c) => {
    return {...acc, [c.name]: 0};
  }, {});
  for (const c of salaryComponents) {
    const incomeTax = c.incomeTax || 0;
    const employeeNI = c.employeeNI || 0;
    const studentLoan = c.studentLoan || 0;
    const grossIncome = c.amount + incomeTax + employeeNI + studentLoan;
    totalSalaryIncome += grossIncome;
    salaryIncomeByCompany[c.company] += grossIncome;
  }

  const totalDividendIncome = dividendComponents.reduce((acc, c) => acc + c.amount, 0);
  const dividendIncomeByCompany = dividendComponents.reduce((acc, c) => {
    return {...acc, [c.company]: (acc[c.company] || 0) + c.amount};
  }, {});

  const totalIncome = totalSalaryIncome + totalDividendIncome;


  return (
    <div key={taxYear} className="mt-6">
      <h2 className="text-3xl font-medium">{taxYear}/{taxYear+1}</h2>
      <div className="text-xl">Total income: {formatCurrency(totalIncome)}</div>
      <div className="ml-8 text-lg">Total salary income: {formatCurrency(totalSalaryIncome)}</div>
      {data.map(c => (
        <div key={c.name} className="ml-16">
          <span className="size-3 rounded-full inline-block mr-1" style={{backgroundColor: c.color}} />
          {c.name}: {formatCurrency(salaryIncomeByCompany[c.name])}
        </div>
      ))}
      <div className="ml-8 text-lg">Total dividend income: {formatCurrency(totalDividendIncome)}</div>
      {data.map(c => (
        <div key={c.name} className="ml-16">
          <span className="size-3 rounded-full inline-block mr-1" style={{backgroundColor: c.color}} />
          {c.name}: {formatCurrency(dividendIncomeByCompany[c.name] || 0)}
        </div>
      ))}
    </div>
  );
};

PersonalTaxYear.propTypes = {
  taxYear: PropTypes.number.isRequired,
};

export default PersonalTaxYear;