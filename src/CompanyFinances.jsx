import React from "react";
import PropTypes from "prop-types";
import { data } from "./data";
import { dateToTaxYear, formatCurrency } from "./utils";
import CompanyTaxYear from "./CompanyTaxYear";

const CompanyFinances = props => {

  const { name } = props;

  const companyData = data.find(c => c.name === name);

  const taxYears = [...new Set(companyData.transactions.map(t => dateToTaxYear(t.date, companyData.monthStart)))];
  taxYears.sort((a, b) => b - a);

  const components = companyData.transactions.filter(t => t.components).map(t => t.components).flat();
  const dividendComponents = components.filter(c => c.type === "dividend");
  const salaryComponents = components.filter(c => c.type === "salary");
  
  
  const totalPaidIn = companyData.transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0) * -1;
  const totalPaidOut = companyData.transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  
  const dividendsPaid = dividendComponents.reduce((acc, c) => acc + c.amount, 0);
  const salaryPaid = salaryComponents.reduce((acc, c) => acc + c.amount, 0);
  const useOfHomePaid = components.filter(c => c.type === "use of home").reduce((acc, c) => acc + c.amount, 0);
  const sharesPaid = components.filter(c => c.type === "shares").reduce((acc, c) => acc + c.amount, 0);
  const unaccountedOut = totalPaidOut - (dividendsPaid + salaryPaid + useOfHomePaid + sharesPaid);
  
  const owed = totalPaidIn - (unaccountedOut)

  return (
    <div>
      <div>
        {owed > 0 ? "The company owes you" : "You owe the company"}: {formatCurrency(Math.abs(owed))}
      </div>
      <div className="flex flex-col gap-12">
        {taxYears.map(taxYear => (
          <CompanyTaxYear key={taxYear} taxYear={taxYear} name={name} />
        ))}
      </div>
    </div>
  );
};

CompanyFinances.propTypes = {
  name: PropTypes.string.isRequired,
};

export default CompanyFinances;