import React, { useState, useEffect, useRef } from "react";
import { Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import CallEndIcon from "@material-ui/icons/CallEnd";
import KeyboardVoiceIcon from "@material-ui/icons/KeyboardVoice";
import MicOffIcon from "@material-ui/icons/MicOff";
import ScreenShareIcon from "@material-ui/icons/ScreenShare";
import StopScreenShareIcon from "@material-ui/icons/StopScreenShare";
import VideocamIcon from "@material-ui/icons/Videocam";
import VideocamOffIcon from "@material-ui/icons/VideocamOff";
import { getUserId } from "../../API/api";
import { createSocketConnectionInstance } from "../../Socket/socketConnection";

import "../../Global/Global.css";
import "./room.css";
import { getName } from "../../API/api";

const useStyles = makeStyles((theme) => ({
  icon: {
    width: "5vh",
    height: "6vh",
  },
  videoButtons: {
    display: "flex",
    justifyContent: "space-evenly",
    alignContent: "center",
    flexWrap: "wrap",
    position: "absolute",
    bottom: 0,
    width: "80%",
    height: "10%",
    marginLeft: "20%",
  },
  textBox: {
    position: "absolute",
    top: "0rem",
    backgroundColor: "#D3D3D3",
    height: "95%",
    width: "20%",
  },
  messageBox: {
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
  },
  messageInputBox: {
    width: "100%",
    fontSize: 20,
    outline: "none",
    height: "3.5%",
    boxSizing: "border-box",
    bottom: "0%",
    position: "relative",
    border: "2px solid black",
  },
  newMessage: {
    backgroundColor: "Blue",
    fontSize: "1.25rem",
    marginBottom: "2px",
    overflowWrap: "break-word",
    color: "white",
    border: "Blue",
    borderRadius: 10,
    marginTop: 2,
    padding: "0.5rem",
  },
  textBoxContainer: {
    backgroundColor: "White",
    position: "relative",
  },
}));

function Room() {
  const classes = useStyles();

  const [clicks, setClicks] = useState({
    showTextBox: false,
    mute: false,
    video: false,
    screenSharing: false,
    inputText: "",
  });

  let socketInstance = useRef(null);
  useEffect(() => {
    getName().then((data) => {
      if (data.name) {
        startConnection();
      } else {
        window.location.href = "/";
      }
    });
  }, []);

  // get a socket connection instance that can initialize socket and peer events that handles streaming
  const startConnection = () => {
    // parameters for stream qualities
    let params = { quality: 12 };
    socketInstance.current = createSocketConnectionInstance({
      params,
    });
  };

  // handle when a user disconnects from a room
  const handleDisconnect = () => {
    socketInstance.current?.destoryConnection();
    getUserId();
  };

  const handleMuteClick = () => {
    setClicks({ ...clicks, mute: !clicks.mute });
    socketInstance.current?.toggleAudio();
  };

  // variable that indicates if the user is screen sharing
  // handle when a user clicks on screen share button
  const toggleScreenShare = (displayStream) => {
    setClicks({ ...clicks, screenSharing: !clicks.screenSharing });
    const { reInitializeStream } = socketInstance.current;
    // to either share screen or go back to sharing webcam
    if (displayStream === "displayMedia") {
      // reinitialize media player for sharing screen
      reInitializeStream(false, true, displayStream)
        .then((stream) => {
          setClicks({ ...clicks, screenSharing: true });
          // to handle if user clicks 'stop sharing' from chrome extension
          stream.getVideoTracks()[0].onended = function () {
            reInitializeStream(true, true, "userMedia").then((stream) => {
              setClicks({
                ...clicks,
                mute: false,
                video: false,
                screenSharing: false,
              });
            });
          };
        })
        .catch(() => {
          setClicks({ ...clicks, screenSharing: false });
        });
    } else {
      // reinitialize media player for sharing web cam
      reInitializeStream(true, true, displayStream).then(() => {
        setClicks({
          ...clicks,
          mute: false,
          video: false,
          screenSharing: false,
        });
      });
    }
  };

  const handleVideoClick = () => {
    setClicks({ ...clicks, video: !clicks.video });
    socketInstance.current?.toggleCamera();
  };

  const handleSendMessage = (e) => {
    if (e.key === "Enter") {
      let msg = "";

      msg = msg.concat(e.target.value);

      socketInstance.current?.sendData(msg);

      let chat = document.querySelector("#chats");
      if (msg !== "") {
        msg = msg
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/"/g, "&quot;");
        let newMsg = document.createElement("div");
        newMsg.className = classes.newMessage;

        newMsg.innerHTML = msg;
        chat.append(newMsg);
        chat.scrollTop = chat.scrollHeight - chat.clientHeight + 1000;
      }
      e.target.value = "";
    }
  };

  return (
    <React.Fragment>
      <div id="room-container" className={classes.videoes}></div>
      <div className={classes.videoButtons}>
        <Button onClick={handleDisconnect}>
          <CallEndIcon
            className={classes.icon}
            style={{ fill: "red" }}
          ></CallEndIcon>
        </Button>

        <Button onClick={handleMuteClick}>
          {clicks.mute ? (
            <MicOffIcon className={classes.icon} />
          ) : (
            <KeyboardVoiceIcon className={classes.icon} />
          )}
        </Button>

        <Button
          onClick={() =>
            toggleScreenShare(
              clicks.screenSharing ? "userMedia" : "displayMedia"
            )
          }
        >
          {clicks.screenSharing ? (
            <ScreenShareIcon className={classes.icon} />
          ) : (
            <StopScreenShareIcon className={classes.icon} />
          )}
        </Button>

        <Button onClick={handleVideoClick}>
          {clicks.video ? (
            <VideocamOffIcon className={classes.icon} />
          ) : (
            <VideocamIcon className={classes.icon} />
          )}
        </Button>
      </div>

      <div className={classes.textBox}>
        <div id="chats" className={classes.messageBox}></div>
        <div className={classes.textBoxContainer}>
          <input
            id="messageInputBox"
            className={classes.messageInputBox}
            onKeyPress={handleSendMessage}
          ></input>
        </div>
      </div>
    </React.Fragment>
  );
}

export default Room;
