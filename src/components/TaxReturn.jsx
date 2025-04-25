import PropTypes from "prop-types";
import { data, taxReturns, hmrcPayments } from "../data";
import { calculateIncomeTaxOwed, calculateStudentLoanOwed, formatCurrency, formatDate, getComponents } from "../utils";

const TaxReturn = props => {

  const { taxYear, useFuture } = props;

  const salaryComponents = getComponents(data, "salary", null, taxYear, useFuture);
  const dividendComponents = getComponents(data, "dividend", null, taxYear, useFuture);
  const interestComponents = getComponents(data, "interest", null, taxYear, useFuture);
  const allComponents = salaryComponents.concat(dividendComponents).concat(interestComponents);

  const totalSalaryIncome = salaryComponents.reduce((acc, c) => acc + c.gross, 0);
  const payeIT = salaryComponents.reduce((acc, c) => acc + c.incomeTax, 0);
  const payeSL = salaryComponents.reduce((acc, c) => acc + c.studentLoan, 0);

  const totalInterestIncome = interestComponents.reduce((acc, c) => acc + c.amount, 0);
  const totalDividendIncome = dividendComponents.reduce((acc, c) => acc + c.amount, 0);
  
  const [incomeTaxOwed] = calculateIncomeTaxOwed(totalSalaryIncome, totalInterestIncome, totalDividendIncome, taxYear);
  const incomeTaxHmrc = incomeTaxOwed - payeIT;

  const studentLoanOwed = calculateStudentLoanOwed(totalSalaryIncome, totalInterestIncome, totalDividendIncome, taxYear);
  const studentLoanHmrc = parseInt(studentLoanOwed - payeSL);

  const hmrcBillPredicted = incomeTaxHmrc + studentLoanHmrc;

  const itPot = allComponents.reduce((acc, c) => acc + (c.itPot || 0), 0);
  const slPot = allComponents.reduce((acc, c) => acc + (c.slPot || 0), 0);

  const taxReturn = taxReturns.find(t => t.taxYear === taxYear);
  const taxReturnTotal = taxReturn ? taxReturn.incomeTax + taxReturn.studentLoan : hmrcBillPredicted;

  const hmrcPaymentsForYear = hmrcPayments.filter(p => p.taxYear === taxYear);
  const hasPayments = hmrcPaymentsForYear.length > 0;
  const totalPaymentsMade = hmrcPaymentsForYear.reduce((acc, p) => acc + p.amount, 0);

  const outstanding =  Math.round(((taxReturn ? taxReturnTotal : hmrcBillPredicted) - totalPaymentsMade) * 100) / 100;

  const yearIsOver = new Date() > new Date(taxYear + 1, 3, 5);

  const headingClass = "text-xs leading-3 font-bold text-slate-500 mb-0.5";

  return (
    <div className={`${props.className || ""}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-medium text-slate-500">
            Tax Return
            {!taxReturn && " (predicted)"}
          </div>
          <div className="text-2xl font-medium">
            <div>{formatCurrency(taxReturn ? taxReturnTotal : hmrcBillPredicted)}</div>
            {taxReturn && (
              <div className="text-xs">Predicted: {formatCurrency(hmrcBillPredicted)}</div>
            )}
          </div>
        </div>
        {outstanding === 0 && yearIsOver && (
          <div className="bg-green-100 border-green-600 text-green-700 border-2 px-2 rounded font-semibold py-0 mt-1">Paid</div>
        )}
        {outstanding !== 0 && yearIsOver && (
          <div className="bg-red-100 border-red-600 text-red-700 border px-2 rounded font-medium mt-1">
            {outstanding > 0 ? "Owe" : "Owed"} {formatCurrency(Math.abs(outstanding))}
          </div>
        )}
      </div>

      <div className="flex gap-x-6">
        <div>
          <div className={headingClass}>Income Tax</div>
          <div className="font-medium">{formatCurrency(taxReturn ? taxReturn.incomeTax : incomeTaxHmrc)}</div>
          {taxReturn && (
            <div className="text-xs font-medium">Predicted: {formatCurrency(incomeTaxHmrc)}</div>
          )}
        </div>
        <div>
          <div className={headingClass}>Student Loan</div>
          <div className="font-medium">{formatCurrency(taxReturn ? taxReturn.studentLoan : studentLoanHmrc)}</div>
          {taxReturn && (
            <div className="text-xs font-medium">Predicted: {formatCurrency(studentLoanHmrc)}</div>
          )}
        </div>
        {(itPot > 0 || slPot > 0) && (
          <div>
            <div className={headingClass}>Pot</div>
            {itPot > 0 && (
              <div className="text-xs font-medium">Income Tax: {formatCurrency(itPot)}</div>
            )}
            {slPot > 0 && (
              <div className="text-xs font-medium">Student Loan: {formatCurrency(slPot)}</div>
            )}
            <div className="text-xs font-semibold">Total: {formatCurrency(itPot + slPot)}</div>
          </div>
        )}
        {hasPayments && (
          <div>
            <div className={headingClass}>HMRC Payments</div>
            <div className="flex flex-col gap-px">
              {hmrcPaymentsForYear.map(p => (
                <div key={p.date} className="text-xs font-medium">
                  {formatDate(p.date)}: {formatCurrency(p.amount)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

TaxReturn.propTypes = {
  taxYear: PropTypes.number.isRequired,
  useFuture: PropTypes.bool.isRequired,
  className: PropTypes.string,
};

export default TaxReturn;