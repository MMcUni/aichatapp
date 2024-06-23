import "./userInfo.css";
import { useUserStore } from "../../../lib/userStore";

const Userinfo = () => {
  const { currentUser } = useUserStore();

  return (
    <div className="userInfo">
      <div className="user">
        <img src={currentUser.avatar || "./avatar.png"} alt="Avatar" />
        <h2>{currentUser?.username}</h2> {/* Added missing curly braces */}
      </div>
      <div className="icons">
        <img src="./more.png" alt="More" />
        <img src="./video.png" alt="Video" />
        <img src="./edit.png" alt="Edit" />
      </div>
    </div>
  );
};

export default Userinfo;