import React from "react";
import PropTypes from "prop-types";
import { data } from "../data";
import { formatCurrency } from "../utils";
import { calculateIncomeTaxOwed, getComponents } from "../utils";

const IncomeTax = props => {

  const { taxYear, useFuture } = props;

  const salaryComponents = getComponents(data, "salary", null, taxYear, useFuture);
  const totalSalaryIncome = salaryComponents.reduce((acc, c) => acc + c.gross, 0);
  const paye = salaryComponents.reduce((acc, c) => acc + c.incomeTax, 0);
  const payeByCompany = data.reduce((acc, c) => {
    const paye = salaryComponents.filter(s => s.company === c.name).reduce((acc, s) => acc + s.incomeTax, 0);
    return {...acc, [c.name]: paye};
  }, {});
  
  const dividendComponents = getComponents(data, "dividend", null, taxYear, useFuture);
  const totalDividendIncome = dividendComponents.reduce((acc, c) => acc + c.amount, 0);

  const interestComponents = getComponents(data, "interest", null, taxYear, useFuture);
  const totalInterestIncome = interestComponents.reduce((acc, c) => acc + c.amount, 0);

  const [incomeTaxOwed, incomeTaxByBand] = calculateIncomeTaxOwed(totalSalaryIncome, totalInterestIncome, totalDividendIncome, taxYear);
  const salaryIncomeTaxOwed = incomeTaxByBand.filter(b => b.type === "salary").reduce((acc, b) => acc + (b.amount * b.rate), 0);
  const interestIncomeTaxOwed = incomeTaxByBand.filter(b => b.type === "interest").reduce((acc, b) => acc + (b.amount * b.rate), 0);
  const dividendIncomeTaxOwed = incomeTaxByBand.filter(b => b.type === "dividend").reduce((acc, b) => acc + (b.amount * b.rate), 0);
  
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
          <div className={indentClass}>Interest: {formatCurrency(interestIncomeTaxOwed)}</div>
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
  useFuture: PropTypes.bool.isRequired,
};

export default IncomeTax;