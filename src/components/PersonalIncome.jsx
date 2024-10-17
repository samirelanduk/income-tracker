import PropTypes from "prop-types";
import { data } from "../data";
import { formatCurrency, getComponents } from "../utils";

const PersonalIncome = props => {

  const { taxYear, useFuture } = props;

  const income = ["salary", "dividend", "use of home", "interest"].map(type => {
    const components = getComponents(data, type, null, taxYear, useFuture);
    const total = components.reduce((acc, c) => acc + (c.type === "salary" ? c.gross : c.amount), 0);
    const byCompany = components.reduce((acc, c) => {
      return {...acc, [c.company]: (acc[c.company] || 0) + (c.type === "salary" ? c.gross : c.amount)};
    }, {});
    return {type, total, byCompany};
  });

  const incomeByCompany = data.reduce((acc, c) => {
    const components = income.reduce((acc, i) => {
      return {...acc, [i.type]: i.byCompany[c.name] || 0};
    }, {});
    components.total = [...Object.values(components)].reduce((acc, c) => acc + c, 0);
    return {...acc, [c.name]: components};
  }, {});

  const totalIncome = income.reduce((acc, i) => acc + i.total, 0);

  const headingClass = "text-xs leading-3 font-bold text-slate-500";
  const indentClass = "text-sm pl-4";
  const circleClass = "rounded-full inline-block mr-1";

  return (
    <div className={`whitespace-nowrap overflow-auto ${props.className || ""}`}>
      <div className="text-3xl font-medium mb-4">{formatCurrency(totalIncome)}</div>
      <div className="flex gap-x-6">
        {income.filter(i => i.total).map(i => (
          <div key={i.type}>
            <div className={headingClass}>{i.type.toUpperCase()[0] + i.type.slice(1)}</div>
            <div className="text-xl font-medium">{formatCurrency(i.total)}</div>
            <div className={indentClass}>
              {data.filter(d => i.byCompany[d.name]).map(c => (
                <div key={c.name} className="">
                  <span className={`size-3 ${circleClass}`} style={{backgroundColor: c.color}} />
                  {c.name}: {formatCurrency(i.byCompany[c.name])}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="w-px flex-shrink-0 bg-gray-200 mx-2" />
        {Object.entries(incomeByCompany).filter(([,i]) => i.total).map(([company, i]) => (
          <div key={company}>
            <div className={headingClass}>
              <span className={`size-2 ${circleClass}`} style={{backgroundColor: data.find(c => c.name === company).color}} />
              {company}
            </div>
            <div className="text-xl font-medium">{formatCurrency(i.total)}</div>
            {Object.entries(i).filter(([key, value]) => key !== "total" && value !== 0).map(([key, value]) => (
              <div key={key} className={indentClass}>
                {key[0].toUpperCase() + key.slice(1)}: {formatCurrency(value)}
              </div>
            ))}
          </div>
        ))}
        <div className="w-px flex-shrink-0 -ml-px" />
      </div>
    </div>
  );
};

PersonalIncome.propTypes = {
  taxYear: PropTypes.number.isRequired,
  useFuture: PropTypes.bool.isRequired,
};

export default PersonalIncome;