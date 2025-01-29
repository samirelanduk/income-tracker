import React, { useState } from "react";
import PropTypes from "prop-types";
import { taxReturns, hmrcPayments } from "../data";
import TaxReturn from "./TaxReturn";
import IncomeTax from "./IncomeTax";
import StudentLoan from "./StudentLoan";
import PaymentsTable from "./PaymentsTable";
import PersonalIncome from "./PersonalIncome";
import NationalInsurance from "./NationalInsurance";
import Status from "./Status";

const PersonalTaxYear = props => {

  const { taxYear, useFuture } = props;

  const [show, setShow] = useState(null);

  let status = "";
  const currentDate = new Date();
  const taxReturn = taxReturns.find(t => t.taxYear === taxYear);
  if (taxReturn) {
    const hmrcPaymentsForYear = hmrcPayments.filter(p => p.taxYear === taxYear);
    const paidToHmrc = hmrcPaymentsForYear.reduce((acc, p) => acc + p.amount, 0);
    const owedToHmrc = taxReturn.incomeTax + taxReturn.studentLoan;
    const outstanding = Math.round((owedToHmrc - paidToHmrc) * 100) / 100;
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

  const showContents = show === null ? status !== "Done" && status !== "Future" : show;

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
        <div className="pt-4">
          <PersonalIncome taxYear={taxYear} useFuture={useFuture} className="border-b pt-2 pb-6 px-6" />
          <div className="border-b flex whitespace-nowrap overflow-auto">
            <IncomeTax taxYear={taxYear} useFuture={useFuture} className="border-r py-4 px-6" />
            <StudentLoan taxYear={taxYear} useFuture={useFuture} className="py-4 px-6 border-r" />
            <NationalInsurance taxYear={taxYear} useFuture={useFuture} className="py-4 px-6" />
          </div>
          <TaxReturn taxYear={taxYear} useFuture={useFuture} className="border-b-4 py-4 px-6" />
          <PaymentsTable taxYear={taxYear} useFuture={useFuture} className="" />
        </div>
      )}
    </div>
  );
};

PersonalTaxYear.propTypes = {
  taxYear: PropTypes.number.isRequired,
};

export default PersonalTaxYear;