import React from "react";
import PropTypes from "prop-types";
import { data } from "./data";

const ModeSwitcher = props => {

  const { mode, setMode } = props;

  const modes = [
    {name: "Personal", color: "#4c9a89"},
    ...data.filter(d => d.controlled).map(c => ({name: c.name, color: c.color}))
  ]

  const selectedMode = modes.find(m => m.name === mode);

  return (
    <div className={`flex justify-end text-lg gap-6 select-none ${props.className || ""}`}>
      {modes.map(m => (
        <button
          key={m.name}
          onClick={() => setMode(m.name)}
          className={`border-b-4 ${mode === m.name ? "" : ""}`}
          style={{
            borderColor: m.color,
            color: mode === m.name ? m.color : null
          }}
        >
          {m.name}
        </button>
      ))}
      <div className="fixed left-0 w-4 top-0 bottom-0" style={{backgroundColor: selectedMode.color}} />
    </div>
  );
};

ModeSwitcher.propTypes = {
  mode: PropTypes.string.isRequired,
  setMode: PropTypes.func.isRequired,
};

export default ModeSwitcher;