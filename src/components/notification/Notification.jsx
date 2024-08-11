import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Notification component for displaying toast notifications
const Notification = () => {
  return (
    <div className="">
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Notification;
