import { useState } from "react";
import PropTypes from "prop-types";
import { data } from "./data";
import { dateToTaxYear } from "./utils";
import { formatCurrency } from "./utils";
import Status from "./Status";

const CompanyTaxYear = props => {

  const { name, taxYear, useFuture } = props;

  const [show, setShow] = useState(null);

  const companyData = data.find(c => c.name === name);

  const components = companyData.transactions.filter(t => t.components && (useFuture || !t.future)).map(
    t => t.components.map(c => ({...c, date: t.date}))
  ).flat();

  const salaryComponents = components.filter(c => c.type === "salary").filter(
    c => dateToTaxYear(c.companyDate || c.date, companyData.monthStart) === taxYear
  )
  const dividendComponents = components.filter(c => c.type === "dividend").filter(
    c => dateToTaxYear(c.companyDate || c.date, companyData.monthStart) === taxYear
  );
  const useOfHomeComponents = components.filter(c => c.type === "use of home").filter(
    c => dateToTaxYear(c.companyDate || c.date, companyData.monthStart) === taxYear
  );

  let salary = 0;
  const salaryIncomeByTaxYear = {};
  for (const c of salaryComponents) {
    const incomeTax = c.incomeTax || 0;
    const employeeNI = c.employeeNI || 0;
    const studentLoan = c.studentLoan || 0;
    const grossIncome = c.amount + incomeTax + employeeNI + studentLoan;
    salary += grossIncome;
    const personalTaxYear = dateToTaxYear(c.date);
    salaryIncomeByTaxYear[personalTaxYear] = (salaryIncomeByTaxYear[personalTaxYear] || 0) + grossIncome;
  }


  let dividends = 0;
  const dividendIncomeByTaxYear = {};
  for (const c of dividendComponents) {
    dividends += c.amount;
    const personalTaxYear = dateToTaxYear(c.date);
    dividendIncomeByTaxYear[personalTaxYear] = (dividendIncomeByTaxYear[personalTaxYear] || 0) + c.amount;
  }

  let useOfHome = 0;
  const useOfHomeIncomeByTaxYear = {};
  for (const c of useOfHomeComponents) {
    useOfHome += c.amount;
    const personalTaxYear = dateToTaxYear(c.date);
    useOfHomeIncomeByTaxYear[personalTaxYear] = (useOfHomeIncomeByTaxYear[personalTaxYear] || 0) + c.amount;
  }

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
          {salary === 0 && dividends === 0 && useOfHome === 0 && (
            <div className="text-lg text-slate-600 italic">No payments.</div>
          )}
          {salary !== 0 && (
            <div>
              <div className={headingClass}>Salary</div>
              <div className="text-xl">{formatCurrency(salary)}</div>
              <div className={indentClass}>
                {Object.entries(salaryIncomeByTaxYear).map(([year, income]) => (
                  <div key={year} className="">
                    {year}/{parseInt(year)+1}: {formatCurrency(income)}
                  </div>
                ))}
              </div>
            </div>
          )}
          {dividends !== 0 && (
            <div>
              <div className={headingClass}>Dividends</div>
              <div className="text-xl">{formatCurrency(dividends)}</div>
              <div className={indentClass}>
                {Object.entries(dividendIncomeByTaxYear).map(([year, income]) => (
                  <div key={year} className="">
                    {year}/{parseInt(year)+1}: {formatCurrency(income)}
                  </div>
                ))}
              </div>
            </div>
          )}
          {useOfHome !== 0 && (
            <div>
              <div className={headingClass}>Use of Home</div>
              <div className="text-xl">{formatCurrency(useOfHome)}</div>
              <div className={indentClass}>
                {Object.entries(useOfHomeIncomeByTaxYear).map(([year, income]) => (
                  <div key={year} className="">
                    {year}/{parseInt(year)+1}: {formatCurrency(income)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

CompanyTaxYear.propTypes = {
  name: PropTypes.string.isRequired,
  taxYear: PropTypes.number.isRequired,
};

export default CompanyTaxYear;