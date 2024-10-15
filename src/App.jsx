import { useState } from "react";
import { data } from "./data";
import ModeSwitcher from "./ModeSwitcher";
import PersonalFinances from "./PersonalFinances";
import CompanyFinances from "./CompanyFinances";
import FutureToggle from "./FutureToggle";
import { dateToTaxYear } from "./utils";

const App = () => {

  const [mode, setMode] = useState("Personal");
  const [useFuture, setUseFuture] = useState(false);

  const allTransactions = data.flatMap(c => c.transactions);

  const taxYears = [...new Set(allTransactions.map(t => dateToTaxYear(t.date)))];
  taxYears.sort((a, b) => b - a);

  return (
    <div className="bg-gray-100 pl-14 pr-10 pt-20 pb-12 text-gray-700">
      <nav className="flex justify-between items-center mb-12 fixed top-0 left-0 pl-14 right-0 pr-12 h-14 bg-gray-100 z-30">
        <FutureToggle useFuture={useFuture} setUseFuture={setUseFuture} />
        <ModeSwitcher mode={mode} setMode={setMode} />
      </nav>
      {mode === "Personal" && <PersonalFinances useFuture={useFuture} />}
      {mode !== "Personal" && <CompanyFinances name={mode} />}
    </div>
  );
};

App.propTypes = {
  
};

export default App;