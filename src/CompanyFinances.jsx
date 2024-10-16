import React from "react";
import PropTypes from "prop-types";
import { data } from "./data";
import { dateToTaxYear, formatCurrency, annotateSalaryComponents } from "./utils";
import CompanyTaxYear from "./CompanyTaxYear";

const CompanyFinances = props => {

  const { name, useFuture } = props;

  const companyData = data.find(c => c.name === name);
  const transactions = companyData.transactions.filter(t => useFuture || !t.future);

  const taxYears = [...new Set(transactions.map(t => dateToTaxYear(t.date, companyData.monthStart)))];
  taxYears.sort((a, b) => b - a);

  const components = transactions.filter(t => t.components).map(t => t.components).flat();
  const dividendComponents = components.filter(c => c.type === "dividend");
  const salaryComponents = components.filter(c => c.type === "salary");
  annotateSalaryComponents(salaryComponents);
  for (const t of transactions) {
    if (t.amount === null) {
      t.amount = t.components.reduce((acc, c) => acc + (c.net || c.amount), 0);
    }
  }
  console.log(transactions);
  
  const totalPaidIn = transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0) * -1;
  const totalPaidOut = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  
  const dividendsPaid = dividendComponents.reduce((acc, c) => acc + c.amount, 0);
  const salaryPaid = salaryComponents.reduce((acc, c) => acc + c.net, 0);
  const useOfHomePaid = components.filter(c => c.type === "use of home").reduce((acc, c) => acc + c.amount, 0);
  const sharesPaid = components.filter(c => c.type === "shares").reduce((acc, c) => acc + c.amount, 0);
  const unaccountedOut = totalPaidOut - (dividendsPaid + salaryPaid + useOfHomePaid + sharesPaid);
  
  const owed = totalPaidIn - (unaccountedOut);

  return (
    <div>
      {owed !== 0 && (
        <div className="border border-yellow-500 rounded text-yellow-800 bg-yellow-50 px-6 py-4 text-xl mb-12">
          {owed > 0 ? "The company owes you" : "You owe the company"} {formatCurrency(Math.abs(owed))}
        </div>
      )}
      <div className="flex flex-col gap-12">
        {taxYears.map(taxYear => (
          <CompanyTaxYear key={taxYear} taxYear={taxYear} name={name} useFuture={useFuture} />
        ))}
      </div>
    </div>
  );
};

CompanyFinances.propTypes = {
  name: PropTypes.string.isRequired,
};

export default CompanyFinances;