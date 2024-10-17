import { useState } from "react";
import PropTypes from "prop-types";
import { data } from "../data";
import { dateToTaxYear, getComponents } from "../utils";
import { formatCurrency } from "../utils";
import Status from "./Status";

const CompanyTaxYear = props => {

  const { name, taxYear, useFuture } = props;

  const [show, setShow] = useState(null);

  const categories = ["salary", "dividend", "use of home"].map(type => {
    const components = getComponents(data, type, name, taxYear, useFuture);
    let amount = 0;
    const byTaxYear = {};
    for (const c of components) {
      const thisAmount = type === "salary" ? c.gross : c.amount;
      amount += thisAmount;
      const personalTaxYear = dateToTaxYear(c.date);
      byTaxYear[personalTaxYear] = (byTaxYear[personalTaxYear] || 0) + thisAmount;
    }
    return {type, amount, byTaxYear};
  }).filter(c => c.amount !== 0);

  const companyData = data.find(c => c.name === name);
  let status = "";
  const currentDate = new Date();
  if (currentDate >= new Date(taxYear + 1, companyData.monthStart - 1, 1)) {
    status = "Done";
  } else if (currentDate < new Date(taxYear, companyData.monthStart - 1, 1)) {
    status = "Future";
  } else {
    status = "Ongoing";
  }

  const showContents = show === null ? status === "Ongoing" || true : show;

  const indentClass = "text-base pl-4";
  const headingClass = "font-medium text-slate-500 text-lg";

  return (
    <div className="white-box">
      <div
        className={showContents ? "box-top-open" : "box-top"}
        onClick={() => setShow(!showContents)}
      >
        <h2>{taxYear}/{taxYear+1}</h2>
        <Status status={status} />
      </div>
      {showContents && (
        <div className="px-6 py-4 flex gap-x-12">
          {categories.length === 0 && (
            <div className="text-lg text-slate-600 italic">No payments.</div>
          )}
          {categories.map(({type, amount, byTaxYear}) => (
            <div key={type}>
              <div className={headingClass}>{type[0].toUpperCase() + type.slice(1)}</div>
              <div className="text-xl">{formatCurrency(amount)}</div>
              <div className={indentClass}>
                {Object.entries(byTaxYear).map(([year, income]) => (
                  <div key={year} className="">
                    {year}/{parseInt(year)+1}: {formatCurrency(income)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

CompanyTaxYear.propTypes = {
  name: PropTypes.string.isRequired,
  taxYear: PropTypes.number.isRequired,
  useFuture: PropTypes.bool.isRequired,
};

export default CompanyTaxYear;