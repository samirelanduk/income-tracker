import React from "react";
import PropTypes from "prop-types";
import { data, taxReturns, hmrcPayments } from "./data";
import { dateToTaxYear, formatCurrency, formatDate } from "./utils";

const PersonalTaxYear = props => {

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

  const taxReturn = taxReturns.find(t => t.taxYear === taxYear);

  const hmrcPaymentsForYear = hmrcPayments.filter(p => p.taxYear === taxYear);
  const hasPayments = hmrcPaymentsForYear.length > 0;

  return (
    <div>
      <h2 className="text-3xl font-medium">{taxYear}/{taxYear+1}</h2>

      <div className="flex gap-x-6">
        <div>
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
        {taxReturn && (
          <div>
            <div className="text-lg">HMRC Owed: {formatCurrency(taxReturn.incomeTax + taxReturn.studentLoan)}</div>
            <div className="text-base ml-8">Income tax: {formatCurrency(taxReturn.incomeTax)}</div>
            <div className="text-base ml-8">Student loan: {formatCurrency(taxReturn.studentLoan)}</div>
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
            <div className="text-lg">Oustanding: {formatCurrency(taxReturn.incomeTax + taxReturn.studentLoan - hmrcPaymentsForYear.reduce((acc, p) => acc + p.amount, 0))}</div>
          </div>
        )}
      </div>
    </div>
  );
};

PersonalTaxYear.propTypes = {
  taxYear: PropTypes.number.isRequired,
};

export default PersonalTaxYear;