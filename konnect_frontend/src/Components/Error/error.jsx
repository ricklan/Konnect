import "./Error.css";
import "../../Global/Global.css";

function Error() {
  let id = window.location.pathname.split("/")[2]; // Gets the status code
  let message = window.location.search.split("=")[1];
  message = message.replace(/%20/g, " "); // Replacing all %20s with a space
  message = message.replace(/%22/g, " "); // Replacing all %22s with a space

  return (
    <div className="error">
      <p className="error">
        Error {id}: {message}
      </p>
    </div>
  );
}

export default Error;
