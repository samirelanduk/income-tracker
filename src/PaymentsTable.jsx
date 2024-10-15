import React from "react";
import PropTypes from "prop-types";
import { data } from "./data";
import { dateToTaxYear, formatCurrency, formatDate } from "./utils";

const PaymentsTable = props => {

  const { taxYear } = props;

  const allTransactions = data.flatMap(c => c.transactions.map(t => ({...t, company: c.name})));
  const components = allTransactions.filter(t => t.components).map(
    t => t.components.map(c => ({...c, company: t.company, date: t.date}))
  ).flat();
  const salaryComponents = components.filter(c => c.type === "salary").filter(
    c => dateToTaxYear(c.personalDate || c.date) === taxYear
  )
  salaryComponents.sort((a, b) => a.date.split("-").map(d => d.padStart(2, "0")).join("-").localeCompare(b.date.split("-").map(d => d.padStart(2, "0")).join("-")));
  const dividendComponents = components.filter(c => c.type === "dividend").filter(
    c => dateToTaxYear(c.personalDate || c.date) === taxYear
  );

  const rows = [];
  for (const c of salaryComponents) {
    const incomeTax = c.incomeTax || 0;
    const employeeNI = c.employeeNI || 0;
    const studentLoan = c.studentLoan || 0;
    const grossIncome = c.amount + incomeTax + employeeNI + studentLoan;
    rows.push({
      date: c.date,
      company: c.company,
      type: "Salary",
      grossIncome,
      incomeTax,
      employeeNI,
      studentLoan,
      net: c.amount,
    });
  }
  for (const c of dividendComponents) {
    rows.push({
      date: c.date,
      company: c.company,
      type: "Dividend",
      grossIncome: c.amount,
      incomeTax: 0,
      employeeNI: 0,
      studentLoan: 0,
      net: c.amount,
    });
  }
  rows.sort((a, b) => a.date.split("-").map(d => d.padStart(2, "0")).join("-").localeCompare(b.date.split("-").map(d => d.padStart(2, "0")).join("-")));

  const cellClass = "py-1 px-2 text-left";

  return (
    <div className={`overflow-x-auto w-full whitespace-nowrap ${props.className || ""}`}>
      <table className="text-sm min-w-full">
        <thead>
          <tr className="bg-sky-200">
            <th className={cellClass}>Date</th>
            <th className={cellClass}>Company</th>
            <th className={cellClass}>Type</th>
            <th className={cellClass}>Gross</th>
            <th className={cellClass}>Income Tax</th>
            <th className={cellClass}>Employee NI</th>
            <th className={cellClass}>Student Loan</th>
            <th className={cellClass}>Net</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, index) => {
            return (
              <tr key={c.date} className={index % 2 === 0 ? "bg-sky-100" : "bg-sky-50"}>
                <td className={cellClass}>{formatDate(c.date)}</td>
                <td className={cellClass}>{c.company}</td>
                <td className={cellClass}>{c.type}</td>
                <td className={cellClass}>{formatCurrency(c.grossIncome)}</td>
                <td className={cellClass}>{formatCurrency(c.incomeTax)}</td>
                <td className={cellClass}>{formatCurrency(c.employeeNI)}</td>
                <td className={cellClass}>{formatCurrency(c.studentLoan)}</td>
                <td className={cellClass}>{formatCurrency(c.net)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

PaymentsTable.propTypes = {
  
};

export default PaymentsTable;