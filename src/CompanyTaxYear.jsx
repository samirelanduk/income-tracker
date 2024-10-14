import React from "react";
import PropTypes from "prop-types";
import { data } from "./data";
import { dateToTaxYear } from "./utils";
import { formatCurrency } from "./utils";

const CompanyTaxYear = props => {

  const { name, taxYear } = props;

  const companyData = data.find(c => c.name === name);
  const components = companyData.transactions.filter(t => t.components).map(
    t => t.components.map(c => ({...c, date: t.date}))
  ).flat();

  const salaryComponents = components.filter(c => c.type === "salary").filter(
    c => dateToTaxYear(c.companyDate || c.date, companyData.monthStart) === taxYear
  )

  const dividendComponents = components.filter(c => c.type === "dividend").filter(
    c => dateToTaxYear(c.companyDate || c.date, companyData.monthStart) === taxYear
  );

  const salary = salaryComponents.filter(c => c.type === "salary").reduce(
    (acc, c) => acc + c.amount + (c.incomeTax || 0) + (c.studentLoan || 0) + (c.employeeNI || 0) , 0);

  const dividends = dividendComponents.reduce((acc, c) => acc + c.amount, 0);


  return (
    <div>
      <h2 className="text-3xl font-medium">{taxYear}/{taxYear+1}</h2>
      <div className="text-xl">Total salary: {formatCurrency(salary)}</div>
      <div className="text-xl">Total dividends: {formatCurrency(dividends)}</div>
    </div>
  );
};

CompanyTaxYear.propTypes = {
  name: PropTypes.string.isRequired,
  taxYear: PropTypes.number.isRequired,
};

export default CompanyTaxYear;