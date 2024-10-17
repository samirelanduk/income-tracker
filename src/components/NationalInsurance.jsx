import React from "react";
import PropTypes from "prop-types";
import { data } from "../data";
import { dateToTaxYear, formatCurrency, annotateSalaryComponents } from "../utils";

const NationalInsurance = props => {

  const { taxYear, useFuture } = props;

  const allTransactions = data.flatMap(c => c.transactions.map(t => ({...t, company: c.name})));
  const components = allTransactions.filter(t => t.components).map(
    t => t.components.map(c => ({...c, company: t.company, date: t.date, future: t.future}))
  ).flat();
  const salaryComponents = components.filter(c => c.type === "salary").filter(
    c => dateToTaxYear(c.personalDate || c.date) === taxYear && (useFuture || !c.future)
  )
  annotateSalaryComponents(salaryComponents);

  let paye = 0;
  let totalSalaryIncome = 0;
  const payeByCompany = data.reduce((acc, c) => {
    return {...acc, [c.name]: 0};
  }, {});
  for (const c of salaryComponents) {
    totalSalaryIncome += c.grossIncome;
    paye += c.employeeNI;
    payeByCompany[c.company] += c.employeeNI;
  }

  return (
    <div className={`${props.className || ""}`}>
      <div className="font-medium text-slate-500">National Insurance</div>
      <div className="text-2xl font-medium -mt-0.5 mb-2">
        {formatCurrency(paye)}
      </div>
      {data.filter(d => payeByCompany[d.name]).map(c => (
        <div key={c.name} className="text-sm pl-4">
          <span className="size-3 rounded-full inline-block mr-1" style={{backgroundColor: c.color}} />
          {c.name}: {formatCurrency(payeByCompany[c.name])}
        </div>
      ))}
    </div>
  );
};

NationalInsurance.propTypes = {
  taxYear: PropTypes.number.isRequired,
};

export default NationalInsurance;