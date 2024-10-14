import React from "react";
import { data } from "./data";
import PersonalTaxYear from "./PersonalTaxYear";
import { dateToTaxYear } from "./utils";

const PersonalFinances = () => {

  const allTransactions = data.flatMap(c => c.transactions);
  const taxYears = [...new Set(allTransactions.map(t => dateToTaxYear(t.date)))];
  taxYears.sort((a, b) => b - a);
  
  return (
    <div className="flex flex-col gap-12">
      {taxYears.map(taxYear => (
        <PersonalTaxYear key={taxYear} taxYear={taxYear} />
      ))}
    </div>
  );
};

PersonalFinances.propTypes = {
  
};

export default PersonalFinances;