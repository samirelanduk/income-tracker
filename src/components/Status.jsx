import PropTypes from "prop-types";

const Status = props => {

  const { status } = props;

  const statusClass = {
    Done: "text-green-700 border-green-600 bg-green-50",
    "Payments pending": "text-yellow-700 border-yellow-600 bg-yellow-50",
    "Needs tax return": "text-orange-700 border-orange-600 bg-orange-50",
    Ongoing: "text-blue-700 border-blue-600 bg-blue-50",
    Future: "text-gray-700 border-gray-600 bg-gray-50",
  }

  return (
    <div className={`border-2 rounded font-semibold px-1.5 ${statusClass[status]}`}>
      {status}
    </div>
  );
};

Status.propTypes = {
  status: PropTypes.string.isRequired,
};

export default Status;