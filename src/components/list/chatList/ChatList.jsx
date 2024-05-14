import './chatList.css';

const ChatList = () => {
  return (
    <div className='chatList'>
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="Search Icon" />
          <input type="text" placeholder="Search" />
        </div>
        <img src="./plus.png" alt="Add Icon" className='add' />
      </div>
    </div>
  );
}

export default ChatList;