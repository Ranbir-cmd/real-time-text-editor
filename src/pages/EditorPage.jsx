import React, { useEffect, useRef } from "react";
import { useState } from "react";
import ACTIONS from "../Actions";
import Client from "../components/Client";
import Editor from "../components/Editor";
// because socket is initialized in another file
import { initSocket } from "../socket";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import toast from "react-hot-toast";

const EditorPage = () => {
  const [clients, setClients] = useState([]);

  const navigate = useNavigate();

  const location = useLocation();
  const { roomId } = useParams();

  const socketRef = useRef(null);
  const codeRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      // after calling this fn, will make connection with socket
      socketRef.current = await initSocket();

      // error handling
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));
      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later");
        navigate("/");
      }

      // emitting join req: sending data of the user who wants to join
      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      // listening joined event: rendering joined users in ui
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          // notifiying others, except me
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room`);
            console.log(`${username} joined`);
          }
          setClients(clients);

          // auto sync
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      // listining disconnected event
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };
    init();

    // clearing listener
    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
    };
  }, []);

 
  if (!location.state) {
    <Navigate to="/" />;
  }

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room Id coppied");
    } catch (error) {
      toast.error("could not copy room Id");
    }
  };

  const leaveRoom = () => {
    navigate("/");
  };

  return (
    <div className="mainWrapper">
      <div className="aside">
        <div className="aside-inner">
          <div className="logo">
            <h2>Code_Editor</h2>
          </div>
          <h4>Online coder</h4>
          <div className="clientsList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>

        <div className="aside-outer">
          <button className="btn copyRoom" onClick={copyRoomId}>
            copy room id
          </button>
          <button className="btn leaveRoom" onClick={leaveRoom}>
            Leave{" "}
          </button>
        </div>
      </div>
      <div className="editorWrapper">
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(code) => {
            codeRef.current = code;
          }}
        />
      </div>
    </div>
  );
};

export default EditorPage;
