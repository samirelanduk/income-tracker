import React from "react";
import PropTypes from "prop-types";

const PersonalTaxYear = props => {

  const { taxYear } = props;

  return (
    <div key={taxYear} className="mt-6">
      <h2 className="text-3xl font-medium">{taxYear}/{taxYear+1}</h2>
      <div>Total income:</div>
      <div>Total salary income:</div>
      <div>Total dividend income:</div>
      <div>Income tax paid:</div>
      <div>Student loan paid:</div>
    </div>
  );
};

PersonalTaxYear.propTypes = {
  taxYear: PropTypes.number.isRequired,
};

export default PersonalTaxYear;