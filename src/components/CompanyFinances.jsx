import React from "react";
import PropTypes from "prop-types";
import { data } from "../data";
import { dateToTaxYear, formatCurrency, getComponents } from "../utils";
import CompanyTaxYear from "./CompanyTaxYear";

const CompanyFinances = props => {

  const { name, useFuture } = props;

  const components = getComponents(data, null, name, null, useFuture);
  const companyData = data.find(c => c.name === name);
  const transactions = companyData.transactions.filter(t => useFuture || !t.future);
  transactions.forEach((t, i) => {
    if (t.amount == null) {
      const matchingComponents = components.filter(c => c.transactionIndex === i);
      t.amount = matchingComponents.reduce((acc, c) => acc + (c.type === "salary" ? c.net : c.amount), 0);
    }
  });
  const netPaid = transactions.reduce((acc, t) => acc + t.amount, 0);
  const accountedOut = components.reduce((acc, c) => acc + (c.type === "salary" ? c.net : c.amount), 0);
  const owed = accountedOut - netPaid;

  const taxYears = [...new Set(transactions.map(t => dateToTaxYear(t.date, companyData.monthStart)))];
  taxYears.sort((a, b) => b - a);

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
  useFuture: PropTypes.bool.isRequired,
};

export default CompanyFinances;