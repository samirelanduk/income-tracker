import React from "react";
import PropTypes from "prop-types";
import { data } from "./data";
import PersonalTaxYear from "./PersonalTaxYear";
import { dateToTaxYear } from "./utils";

const PersonalFinances = props => {

  const { useFuture } = props;

  const allTransactions = data.flatMap(c => c.transactions).filter(t => useFuture || !t.future);
  const taxYears = [...new Set(allTransactions.map(t => dateToTaxYear(t.date)))];
  taxYears.sort((a, b) => b - a);
  
  return (
    <div className="flex flex-col gap-12">
      {taxYears.map(taxYear => (
        <PersonalTaxYear key={taxYear} taxYear={taxYear} useFuture={useFuture} />
      ))}
    </div>
  );
};

PersonalFinances.propTypes = {
  useFuture: PropTypes.bool.isRequired,
};

export default PersonalFinances;