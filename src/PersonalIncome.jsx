import PropTypes from "prop-types";
import { data } from "./data";
import { dateToTaxYear, formatCurrency } from "./utils";

const PersonalIncome = props => {

  const { taxYear } = props;

  const allTransactions = data.flatMap(c => c.transactions.map(t => ({...t, company: c.name})));
  const components = allTransactions.filter(t => t.components).map(
    t => t.components.map(c => ({...c, company: t.company, date: t.date}))
  ).flat();

  const salaryComponents = components.filter(c => c.type === "salary").filter(
    c => dateToTaxYear(c.personalDate || c.date) === taxYear
  )
  const dividendComponents = components.filter(c => c.type === "dividend").filter(
    c => dateToTaxYear(c.personalDate || c.date) === taxYear
  );
  const useOfHomeComponents = components.filter(c => c.type === "use of home").filter(
    c => dateToTaxYear(c.personalDate || c.date) === taxYear
  );

  let totalSalaryIncome = 0;
  const salaryIncomeByCompany = data.reduce((acc, c) => {
    return {...acc, [c.name]: 0};
  }, {});
  for (const c of salaryComponents) {
    const incomeTax = c.incomeTax || 0;
    const employeeNI = c.employeeNI || 0;
    const studentLoan = c.studentLoan || 0;
    const grossIncome = c.amount + incomeTax + employeeNI + studentLoan;
    totalSalaryIncome += grossIncome;
    salaryIncomeByCompany[c.company] += grossIncome;
  }

  const totalDividendIncome = dividendComponents.reduce((acc, c) => acc + c.amount, 0);
  const dividendIncomeByCompany = dividendComponents.reduce((acc, c) => {
    return {...acc, [c.company]: (acc[c.company] || 0) + c.amount};
  }, {});

  const totalUseOfHome = useOfHomeComponents.reduce((acc, c) => acc + c.amount, 0);
  const useOfHomeByCompany = useOfHomeComponents.reduce((acc, c) => {
    return {...acc, [c.company]: (acc[c.company] || 0) + c.amount};
  }, {});

  const incomeByCompany = data.reduce((acc, c) => {
    const components = {
      salary: salaryIncomeByCompany[c.name] || 0,
      dividend: dividendIncomeByCompany[c.name] || 0,
      useOfHome: useOfHomeByCompany[c.name] || 0,
    }
    components.total = components.salary + components.dividend + components.useOfHome;
    return {...acc, [c.name]: components};
  }, {});

  const totalIncome = totalSalaryIncome + totalDividendIncome + totalUseOfHome;

  const headingClass = "text-xs leading-3 font-bold text-slate-500";
  const indentClass = "text-sm pl-4";
  const circleClass = "rounded-full inline-block mr-1";

  return (
    <div className={`whitespace-nowrap overflow-auto ${props.className || ""}`}>
      <div className="text-3xl font-medium mb-2">{formatCurrency(totalIncome)}</div>
      <div className="flex gap-x-6">
        {totalSalaryIncome !== 0 && (
          <div>
            <div className={headingClass}>Salary</div>
            <div className="text-xl font-medium">{formatCurrency(totalSalaryIncome)}</div>
            <div className={indentClass}>
              {data.filter(d => salaryIncomeByCompany[d.name]).map(c => (
                <div key={c.name} className="">
                  <span className={`size-3 ${circleClass}`} style={{backgroundColor: c.color}} />
                  {c.name}: {formatCurrency(salaryIncomeByCompany[c.name] || 0)}
                </div>
              ))}
            </div>
          </div>
        )}
        {totalDividendIncome !== 0 && (
          <div>
            <div className={headingClass}>Dividends</div>
            <div className="text-xl font-medium">{formatCurrency(totalDividendIncome)}</div>
            <div className={indentClass}>
              {data.filter(d => dividendIncomeByCompany[d.name]).map(c => (
                <div key={c.name}>
                  <span className={`size-3 ${circleClass}`} style={{backgroundColor: c.color}} />
                  {c.name}: {formatCurrency(dividendIncomeByCompany[c.name] || 0)}
                </div>
              ))}
            </div>
          </div>
        )}
        {totalUseOfHome !== 0 && (
          <div>
            <div className={headingClass}>Use of Home</div>
            <div className="text-xl font-medium">{formatCurrency(totalUseOfHome)}</div>
            <div className={indentClass}>
              {data.filter(d => useOfHomeByCompany[d.name]).map(c => (
                <div key={c.name}>
                  <span className={`size-3 ${circleClass}`} style={{backgroundColor: c.color}} />
                  {c.name}: {formatCurrency(useOfHomeByCompany[c.name] || 0)}
                </div>
              ))}
            </div>
          </div>
        )}
        {Object.entries(incomeByCompany).filter(([,income]) => income.total).map(([company, income]) => (
          <div key={company}>
            <div className={headingClass}>
              <span className={`size-2 ${circleClass}`} style={{backgroundColor: data.find(c => c.name === company).color}} />
              {company}
            </div>
            <div className="text-xl font-medium">{formatCurrency(income.total)}</div>
            {income.salary !== 0 && <div className={indentClass}>Salary: {formatCurrency(income.salary)}</div>}
            {income.dividend !== 0 && <div className={indentClass}>Dividends: {formatCurrency(income.dividend)}</div>}
            {income.useOfHome !== 0 && <div className={indentClass}>Use of Home: {formatCurrency(income.useOfHome)}</div>}
          </div>
        ))}
        <div className="w-px flex-shrink-0 -ml-px" />
      </div>
    </div>
  );
};

PersonalIncome.propTypes = {
  taxYear: PropTypes.number.isRequired,
};

export default PersonalIncome;