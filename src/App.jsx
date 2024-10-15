import { useState } from "react";
import { data } from "./data";
import ModeSwitcher from "./ModeSwitcher";
import PersonalFinances from "./PersonalFinances";
import CompanyFinances from "./CompanyFinances";
import FutureToggle from "./FutureToggle";

const App = () => {

  const [mode, setMode] = useState("Personal");
  const [useFuture, setUseFuture] = useState(false);

  const allTransactions = data.flatMap(c => c.transactions);

  const dateToTaxYear = date => {
    const year = parseInt(date.split("-")[0]);
    const month = parseInt(date.split("-")[1]);
    return month < 4 ? year - 1 : year;
  }

  const taxYears = [...new Set(allTransactions.map(t => dateToTaxYear(t.date)))];
  taxYears.sort((a, b) => b - a);

  return (
    <div className="bg-gray-100  pl-14 pr-10 pt-6 pb-12 text-gray-700">
      <div className="flex justify-between items-center mb-12">
        <FutureToggle useFuture={useFuture} setUseFuture={setUseFuture} />
        <ModeSwitcher mode={mode} setMode={setMode} />
      </div>
      {mode === "Personal" && <PersonalFinances useFuture={useFuture} />}
      {mode !== "Personal" && <CompanyFinances name={mode} />}
    </div>
  );
};

App.propTypes = {
  
};

export default App;