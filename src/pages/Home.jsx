import React from "react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  const navigate = useNavigate();

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidv4();
    setRoomId(id);
    toast.success("new room created");
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("Room Id and Username is required");
      return;
    } else {
      // redirect
      navigate(`/editor/${roomId}`, {
        state: {
          username,
        },
      });
    }
  };

  return (
    <div className="homeWrapper">
      <div className="formWrapper">
        <h3 className="mainLabel">Join Room</h3>
        <div className="inputGroup">
          <input
            type="text"
            className="inputBox"
            placeholder="Paste Room Id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyUp={(e) => {
              if (e.code === "Enter") joinRoom();
            }}
          />
          <input
            type="text"
            className="inputBox"
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
            onKeyUp={(e) => {
              if (e.code === "Enter") joinRoom();
            }}
          />
          <button className="btn joinBtn" onClick={joinRoom}>
            Join
          </button>
          <span className="createInfo">
            if you dont have an invitation id then create &nbsp;
            <a href="" onClick={createNewRoom} className="createNewBtn">
              new room
            </a>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Home;
