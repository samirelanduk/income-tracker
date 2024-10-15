import React, { useState } from "react";
import PropTypes from "prop-types";
import { taxReturns, hmrcPayments } from "./data";
import TaxReturn from "./TaxReturn";
import IncomeTax from "./IncomeTax";
import StudentLoan from "./StudentLoan";
import PaymentsTable from "./PaymentsTable";
import PersonalIncome from "./PersonalIncome";

const PersonalTaxYear = props => {

  const { taxYear } = props;

  const [show, setShow] = useState(null);

  let status = "";
  const currentDate = new Date();
  const taxReturn = taxReturns.find(t => t.taxYear === taxYear);
  if (taxReturn) {
    const hmrcPaymentsForYear = hmrcPayments.filter(p => p.taxYear === taxYear);
    const paidToHmrc = hmrcPaymentsForYear.reduce((acc, p) => acc + p.amount, 0);
    const owedToHmrc = taxReturn.incomeTax + taxReturn.studentLoan;
    const outstanding = owedToHmrc - paidToHmrc;
    if (outstanding === 0) {
      status = "Done";
    } else {
      status = "Payments pending";
    }
  } else if (currentDate > new Date(taxYear + 1, 3, 5)) {
    status = "Needs tax return";
  } else if (currentDate >= new Date(taxYear, 3, 5)) {
    status = "Ongoing";
  } else {
    status = "Future";
  }

  const showContents = show === null ? status !== "Done" : show;

  const statusClass = {
    Done: "text-green-700 border-green-600 bg-green-50",
    "Payments pending": "text-yellow-700 border-yellow-600 bg-yellow-50",
    "Needs tax return": "text-orange-700 border-orange-600 bg-orange-50",
    Ongoing: "text-blue-700 border-blue-600 bg-blue-50",
    Future: "text-gray-700 border-gray-600 bg-gray-50",
  }


  return (
    <div className="bg-white shadow border rounded-lg overflow-hidden">

      <div
        className={`px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-300 ${showContents ? "pb-4 border-b-2" : ""}`}
        onClick={() => setShow(!showContents)}
      >
        <h2 className="text-4xl font-semibold">{taxYear}/{taxYear+1}</h2>
        <div className={`border-2 rounded font-semibold px-1.5 ${statusClass[status]}`}>{status}</div>
      </div>

      {showContents && (
        <div className="py-4">
          <PersonalIncome taxYear={taxYear} className="border-b pb-4 px-6" />
          <IncomeTax taxYear={taxYear} className="border-b py-4 px-6" />
          <StudentLoan taxYear={taxYear} className="border-b py-4 px-6" />
          <TaxReturn taxYear={taxYear} className="border-b py-4 px-6" />

      


          <PaymentsTable taxYear={taxYear} />
        </div>
      )}
    </div>
  );
};

PersonalTaxYear.propTypes = {
  taxYear: PropTypes.number.isRequired,
};

export default PersonalTaxYear;