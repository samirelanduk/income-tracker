import React from "react";
import PropTypes from "prop-types";
import { data } from "../data";
import { dateToTaxYear, formatCurrency } from "../utils";
import { calculateSalaryIncomeTaxOwed, calculateDividendIncomeTaxOwed, annotateSalaryComponents } from "../utils";

const IncomeTax = props => {

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

  let paye = 0;
  let totalSalaryIncome = 0;
  const payeByCompany = data.reduce((acc, c) => {
    return {...acc, [c.name]: 0};
  }, {});
  for (const c of salaryComponents) {
    totalSalaryIncome += c.grossIncome;
    paye += c.incomeTax;
    payeByCompany[c.company] += c.incomeTax;
  }

  const totalDividendIncome = dividendComponents.reduce((acc, c) => acc + c.amount, 0);
  const totalIncome = totalSalaryIncome + totalDividendIncome;
  const salaryIncomeTaxOwed = calculateSalaryIncomeTaxOwed(totalIncome, totalSalaryIncome, taxYear);
  const dividendIncomeTaxOwed = calculateDividendIncomeTaxOwed(totalIncome, totalDividendIncome, taxYear);
  const incomeTaxOwed = salaryIncomeTaxOwed + dividendIncomeTaxOwed;
  const hmrcBill = incomeTaxOwed - paye;

  const indentClass = "text-sm pl-4";



  return (
    <div className={`${props.className || ""}`}>
      <div className="font-medium text-slate-500">Income Tax</div>
      <div className="text-2xl font-medium -mt-0.5 mb-2">
        {formatCurrency(incomeTaxOwed)}
      </div>
      <div className="flex gap-x-6">
        <div>
          <div className="font-medium">
            <span className="text-xs font-bold text-gray-600">PAYE: </span>{formatCurrency(paye)}
          </div>
          {data.filter(d => payeByCompany[d.name]).map(c => (
            <div key={c.name} className={indentClass}>
              <span className="size-3 rounded-full inline-block mr-1" style={{backgroundColor: c.color}} />
              {c.name}: {formatCurrency(payeByCompany[c.name])}
            </div>
          ))}
        </div>
        <div>
          <div className="font-medium">
            <span className="text-xs font-bold text-gray-600">Total owed: </span>{formatCurrency(incomeTaxOwed)}
          </div>
          <div className={indentClass}>Salary: {formatCurrency(salaryIncomeTaxOwed)}</div>
          <div className={indentClass}>Dividend: {formatCurrency(dividendIncomeTaxOwed)}</div>
        </div>
        <div className="font-medium">
          <span className="text-xs font-bold text-gray-600">HMRC Bill: </span>{formatCurrency(hmrcBill)}
        </div>
      </div>
    </div>
  );
};

IncomeTax.propTypes = {
  taxYear: PropTypes.number.isRequired,
};

export default IncomeTax;