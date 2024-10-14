import { useState } from "react";
import { data } from "./data";
import ModeSwitcher from "./ModeSwitcher";
import PersonalFinances from "./PersonalFinances";
import CompanyFinances from "./CompanyFinances";

const App = () => {

  const [mode, setMode] = useState("Deep Mountain");

  const allTransactions = data.flatMap(c => c.transactions);

  const dateToTaxYear = date => {
    const year = parseInt(date.split("-")[0]);
    const month = parseInt(date.split("-")[1]);
    return month < 4 ? year - 1 : year;
  }

  const taxYears = [...new Set(allTransactions.map(t => dateToTaxYear(t.date)))];
  taxYears.sort((a, b) => b - a);

  return (
    <div className="p-4">
      <ModeSwitcher mode={mode} setMode={setMode} />
      <h1 className="text-5xl mt-8 mb-12 font-medium">{mode}</h1>
      {mode === "Personal" && <PersonalFinances />}
      {mode !== "Personal" && <CompanyFinances name={mode} />}
    </div>
  );
};

App.propTypes = {
  
};

export default App;