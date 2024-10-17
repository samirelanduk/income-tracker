import React from "react";
import PropTypes from "prop-types";
import { data } from "../data";
import { formatCurrency, getComponents } from "../utils";

const NationalInsurance = props => {

  const { taxYear, useFuture } = props;

  const salaryComponents = getComponents(data, "salary", null, taxYear, useFuture);
  const paye = salaryComponents.reduce((acc, c) => acc + c.employeeNI, 0);
  const payeByCompany = data.reduce((acc, c) => {
    const paye = salaryComponents.filter(s => s.company === c.name).reduce((acc, s) => acc + s.employeeNI, 0);
    return {...acc, [c.name]: paye};
  }, {});

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
  useFuture: PropTypes.bool,
};

export default NationalInsurance;