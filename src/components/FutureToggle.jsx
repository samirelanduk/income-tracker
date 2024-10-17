import React from "react";
import PropTypes from "prop-types";

const FutureToggle = props => {

  const { useFuture, setUseFuture } = props;

  return (
    <div onClick={() => setUseFuture(!useFuture)} className="cursor-pointer flex items-center">
      <input
        type="checkbox"
        checked={useFuture}
        onChange={e => setUseFuture(e.target.checked)}
        className="mr-2"
      />
      <label className="pointer-events-none select-none">Use future payments</label>
    </div>
  );
};

FutureToggle.propTypes = {
  useFuture: PropTypes.bool.isRequired,
  setUseFuture: PropTypes.func.isRequired,
};

export default FutureToggle;