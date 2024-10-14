import React from "react";
import PropTypes from "prop-types";
import { data } from "./data";
import { dateToTaxYear, formatCurrency, formatDate } from "./utils";

const PaymentsTable = props => {

  const { taxYear } = props;

  const allTransactions = data.flatMap(c => c.transactions.map(t => ({...t, company: c.name})));
  //console.log(allTransactions.map(t => t.date));
  const components = allTransactions.filter(t => t.components).map(
    t => t.components.map(c => ({...c, company: t.company, date: t.date}))
  ).flat();
  //if (taxYear === 2021) console.log(components.map(c => c.date));
  const salaryComponents = components.filter(c => c.type === "salary").filter(
    c => dateToTaxYear(c.personalDate || c.date) === taxYear
  )
  if (taxYear === 2021) console.log(salaryComponents.map(c => c.date));
  salaryComponents.sort((a, b) => a.date.split("-").map(d => d.padStart(2, "0")).join("-").localeCompare(b.date.split("-").map(d => d.padStart(2, "0")).join("-")));
  const dividendComponents = components.filter(c => c.type === "dividend").filter(
    c => dateToTaxYear(c.personalDate || c.date) === taxYear
  );

  const cellClass = "py-1 pr-2 text-left";

  return (
    <table className="text-sm border">
      <thead>
        <tr>
          <th className={cellClass}>Company</th>
          <th className={cellClass}>Date</th>
          <th className={cellClass}>Type</th>
          <th className={cellClass}>Gross</th>
          <th className={cellClass}>Income Tax</th>
          <th className={cellClass}>Employee NI</th>
          <th className={cellClass}>Student Loan</th>
          <th className={cellClass}>Net</th>
        </tr>
      </thead>
      <tbody>
        {salaryComponents.map(c => {
          const incomeTax = c.incomeTax || 0;
          const employeeNI = c.employeeNI || 0;
          const studentLoan = c.studentLoan || 0;
          const grossIncome = c.amount + incomeTax + employeeNI + studentLoan;
          return (
            <tr key={c.date}>
              <td className={cellClass}>{c.company}</td>
              <td className={cellClass}>{formatDate(c.date)}</td>
              <td className={cellClass}>Salary</td>
              <td className={cellClass}>{formatCurrency(grossIncome)}</td>
              <td className={cellClass}>{formatCurrency(incomeTax)}</td>
              <td className={cellClass}>{formatCurrency(employeeNI)}</td>
              <td className={cellClass}>{formatCurrency(studentLoan)}</td>
              <td className={cellClass}>{formatCurrency(c.amount)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

PaymentsTable.propTypes = {
  
};

export default PaymentsTable;