import { useState } from "react";
import { data } from "./data";
import ModeSwitcher from "./ModeSwitcher";

const App = () => {

  const [mode, setMode] = useState("Personal");

  return (
    <div className="p-4">

      <ModeSwitcher mode={mode} setMode={setMode} />

      <h1 className="text-5xl mt-6 font-medium">{mode}</h1>
    </div>
  );
};

App.propTypes = {
  
};

export default App;