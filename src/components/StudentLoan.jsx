import PropTypes from "prop-types";
import { data } from "../data";
import { calculateStudentLoanOwed, getComponents } from "../utils";
import { formatCurrency } from "../utils";

const StudentLoan = props => {
  
  const { taxYear, useFuture } = props;

  const salaryComponents = getComponents(data, "salary", null, taxYear, useFuture);
  const totalSalaryIncome = salaryComponents.reduce((acc, c) => acc + c.gross, 0);
  const paye = salaryComponents.reduce((acc, c) => acc + c.studentLoan, 0);
  const payeByCompany = data.reduce((acc, c) => {
    const paye = salaryComponents.filter(s => s.company === c.name).reduce((acc, s) => acc + s.studentLoan, 0);
    return {...acc, [c.name]: paye};
  }, {});

  const dividendComponents = getComponents(data, "dividend", null, taxYear, useFuture);
  const interestComponents = getComponents(data, "interest", null, taxYear, useFuture);
  const totalDividendIncome = dividendComponents.reduce((acc, c) => acc + c.amount, 0);
  const totalInterestIncome = interestComponents.reduce((acc, c) => acc + c.amount, 0);
  const studentLoanOwed = calculateStudentLoanOwed(totalSalaryIncome, totalDividendIncome, totalInterestIncome, taxYear);
  const hmrcBill = studentLoanOwed - paye;

  const indentClass = "text-sm pl-4";

  return (
    <div className={`${props.className || ""}`}>
      <div className="font-medium text-slate-500">Student Loan</div>
      <div className="text-2xl font-medium -mt-0.5 mb-2">
        {formatCurrency(studentLoanOwed)}
      </div>
      <div className="flex flex-col gap-1">
        <div>
          <div className="font-medium">
            <span className="text-xs font-bold text-gray-600">PAYE: </span>{formatCurrency(paye)}
          </div>
          {data.filter(d => payeByCompany[d.name]).map(c => (
            <div key={c.name} className={indentClass}>
              <span className="size-3 rounded-full inline-block mr-1" style={{backgroundColor: c.color}} />
              {c.name}: {formatCurrency(payeByCompany[c.name])}
            </div>
          ))}
        </div>
        <div className="font-medium">
          <span className="text-xs font-bold text-gray-600">Total owed: </span>{formatCurrency(studentLoanOwed)}
        </div>
        <div className="font-medium">
          <span className="text-xs font-bold text-gray-600">HMRC Bill: </span>{formatCurrency(hmrcBill)}
        </div>
      </div>
    </div>
  );
};

StudentLoan.propTypes = {
  taxYear: PropTypes.number.isRequired,
  useFuture: PropTypes.bool,
  className: PropTypes.string,
};

export default StudentLoan;