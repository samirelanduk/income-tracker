import React from "react";
import PropTypes from "prop-types";
import { data } from "./data";

const ModeSwitcher = props => {

  const { mode, setMode } = props;

  const modes = [
    {name: "Personal", color: "#4c9a89"},
    ...data.map(c => ({name: c.name, color: c.color}))
  ]

  return (
    <div className="flex gap-4">
      {modes.map(m => (
        <button
          key={m.name}
          onClick={() => setMode(m.name)}
          className={`border-b-4 ${mode === m.name ? "font-bold" : ""}`}
          style={{
            borderColor: m.color,
            color: mode === m.name ? m.color : null
          }}
        >
          {m.name}
        </button>
      ))}
    </div>
  );
};

ModeSwitcher.propTypes = {
  
};

export default ModeSwitcher;