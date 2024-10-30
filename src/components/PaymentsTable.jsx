import { useState } from "react";
import PropTypes from "prop-types";
import { data } from "../data";
import { formatCurrency, formatDate, getComponents } from "../utils";

const PaymentsTable = props => {

  const { taxYear, useFuture } = props;

  const [showSmall, setShowSmall] = useState(false);

  const salaryComponents = getComponents(data, "salary", null, taxYear, useFuture);
  const dividendComponents = getComponents(data, "dividend", null, taxYear, useFuture);
  const interestComponents = getComponents(data, "interest", null, taxYear, useFuture);
  const useOfHomeComponents = getComponents(data, "use of home", null, taxYear, useFuture);

  const rows = [];
  for (const c of salaryComponents) {
    if (!showSmall && c.gross < 200) continue;
    rows.push({
      date: c.date,
      company: c.company,
      color: c.color,
      type: "Salary",
      gross: c.gross,
      incomeTax: c.incomeTax,
      employeeNI: c.employeeNI,
      studentLoan: c.studentLoan,
      net: c.net,
      future: c.future,
    });
  }
  for (const c of dividendComponents) {
    if (!showSmall && c.amount < 200) continue;
    rows.push({
      date: c.date,
      company: c.company,
      color: c.color,
      type: "Dividend",
      gross: c.amount,
      incomeTax: 0,
      employeeNI: 0,
      studentLoan: 0,
      net: c.amount,
      future: c.future,
    });
  }
  for (const c of interestComponents) {
    if (!showSmall && c.amount < 200) continue;
    rows.push({
      date: c.date,
      company: c.company,
      color: c.color,
      type: "Interest",
      gross: c.amount,
      incomeTax: 0,
      employeeNI: 0,
      studentLoan: 0,
      net: c.amount,
      future: c.future,
    });
  }
  for (const c of useOfHomeComponents) {
    if (!showSmall && c.amount < 200) continue;
    rows.push({
      date: c.date,
      company: c.company,
      color: c.color,
      type: "Use of Home",
      gross: c.amount,
      incomeTax: 0,
      employeeNI: 0,
      studentLoan: 0,
      net: c.amount,
    });
  }

  rows.sort((a, b) => a.date.split("-").map(d => d.padStart(2, "0")).join("-").localeCompare(b.date.split("-").map(d => d.padStart(2, "0")).join("-")));

  const cellClass = "py-1 px-2 text-left table-cell-flex";

  return (
    <div className="relative">
      <div className="flex justify-end items-center absolute right-2 -top-7 cursor-pointer" onChange={() => setShowSmall(!showSmall)}>
        <label className="text-sm mr-1 select-none cursor-pointer" htmlFor="small">Show small amounts</label>
        <input id="small" type="checkbox" className="cursor-pointer" checked={showSmall} onChange={() => setShowSmall(!showSmall)} />
      </div>
      <div className={`overflow-x-auto w-full whitespace-nowrap ${props.className || ""}`}>
        <table className="text-sm min-w-full">
          <thead>
            <tr className="bg-slate-200">
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
                <tr key={index} className={`${index % 2 === 0 ? "bg-slate-100" : "bg-slate-200"} ${c.future ? "italic text-gray-500 font-light" : ""}`}>
                  <td className={cellClass}>{formatDate(c.date)}</td>
                  <td className={cellClass}>
                    <span className="size-2 rounded-full inline-block mr-1 mb-px" style={{backgroundColor: c.color}} />
                    {c.company}
                  </td>
                  <td className={cellClass}>{c.type}</td>
                  <td className={cellClass}>{formatCurrency(c.gross)}</td>
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
    </div>
  );
};

PaymentsTable.propTypes = {
  taxYear: PropTypes.number.isRequired,
  useFuture: PropTypes.bool.isRequired,
};

export default PaymentsTable;