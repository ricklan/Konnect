import Peer from "peerjs";
import { getName } from "../API/api";
const io = require("socket.io-client");

class Connection {
  myID = "";
  name = "";
  videoContainer = {};
  settings;
  streamObject;
  myPeer;
  socket;
  connected = false;
  connect;
  peers = {};
  roomId = "";
  constructor(settings) {
    this.settings = settings;

    this.myPeer = new Peer(undefined, {
      host: process.env.REACT_APP_PEERJS_HOST,
      path: "/",
      port: process.env.REACT_APP_PROD ? 443 : 9000,
      secure: process.env.REACT_APP_PROD !== undefined, // enables https
    });

    getName()
      .then((data) => {
        this.name = data.name;
      })
      .catch((err) => {
        console.log(err);
      });

    const url = process.env.REACT_APP_PROD
      ? `wss://${process.env.REACT_APP_SOCKET_URL}`
      : `ws://${process.env.REACT_APP_SOCKET_URL}`;

    this.socket = io.connect(url, { reconnect: true });

    // initialize socket and peers
    this.initializeSocketEvents();
    this.initializePeersEvents();
  }

  // initialize socket events
  initializeSocketEvents = () => {
    this.socket.on("connect", () => {
      console.log("connected");
    });
    this.socket.on("user-disconnected", (userID) => {
      // close peer connection
      if (this.peers[userID]) {
        this.peers[userID].close();
      }
      this.removeVideo(userID);
      this.updateScreen();
    });
    this.socket.on("disconnect", () => {
      console.log("disconnected");
    });
    this.socket.on("error", (err) => {
      console.log("socket error: " + err);
    });

    this.socket.on("newMessage", (data) => {
      this.createNewMessage(data);
    });
  };

  // initialize peer events
  initializePeersEvents = () => {
    this.myPeer.on("open", (id) => {
      console.log("PeerJS connected");
      this.myID = id;
      this.roomId = window.location.pathname.split("/")[2];
      const userData = {
        userID: id,
        roomID: this.roomId,
      };
      // set user's own video stream and listen for other users' stream
      this.setStreamAndPeerListener(userData);
    });

    this.myPeer.on("error", (err) => {
      console.log("peer connection error", err);
      this.myPeer.reconnect();
    });
  };

  // set user's own video stream and listen for other users' stream
  setStreamAndPeerListener = (userData) => {
    this.getVideoAudioStream().then((stream) => {
      // let other users know that a new user has joined and is ready to be called
      this.socket.emit("join-room", userData);
      if (stream) {
        this.streamObject = stream;
        this.streaming = true;
        this.createVideo({ id: this.myID, stream });
        // listen for incoming calls
        this.setPeersListeners();
        // call incoming users
        this.newUserConnection();
      }
    });
  };

  // set and return video and audio media stream
  getVideoAudioStream = async (video = true, audio = true) => {
    let quality = this.settings.params?.quality;
    if (quality) {
      quality = parseInt(quality);
    }
    console.log(navigator.mediaDevices);
    return await navigator.mediaDevices.getUserMedia({
      video: video
        ? {
            frameRate: quality ? quality : 12,
            noiseSuppression: true,
          }
        : false,
      audio: audio,
    });
  };

  // create video
  createVideo = (createObj) => {
    if (!this.videoContainer[createObj.id]) {
      this.videoContainer[createObj.id] = {
        ...createObj,
      };
      const roomContainer = document.getElementById("room-container");
      const videoContainer = document.createElement("div");
      videoContainer.className = "videoContainer";
      const video = document.createElement("video");
      video.srcObject = this.videoContainer[createObj.id].stream;
      video.id = createObj.id;
      video.autoplay = true;
      if (this.myID === createObj.id) video.muted = true;
      videoContainer.appendChild(video);
      if (roomContainer) roomContainer.append(videoContainer);
    } else {
      const streamObj = document.getElementById(createObj.id);
      if (streamObj) streamObj.srcObject = createObj.stream;
    }
    this.updateScreen();
  };

  // listen for incoming calls
  setPeersListeners = () => {
    // when a user calls the the current peer, answer the call and create new video for the user calling them
    let stream = this.streamObject;
    this.myPeer.on("call", (call) => {
      call.answer(stream);
      // create new video for incoming caller
      call.on("stream", (userVideoStream) => {
        this.createVideo({
          id: call.metadata.id,
          stream: userVideoStream,
        });
      });
      // close video for incoming caller if they leave or an error occurs
      call.on("close", () => {
        this.removeVideo(call.metadata.id);
      });
      call.on("error", () => {
        this.removeVideo(call.metadata.id);
      });
      this.peers[call.metadata.id] = call;
    });
  };

  // when new user joins room, establish peer connection to new user
  newUserConnection() {
    this.socket.on("new-user-connect", (userData) => {
      let stream = this.streamObject;
      // need to wait a bit because peer instance may not be fully initialized
      setTimeout(() => {
        this.connectToNewUser(userData, stream);
      }, 1500);
    });
    // emit this event to indicate that every listener is active and ready to listen for new user joining the room
    this.socket.emit("listeners-ready", this.roomId);
  }

  // establish peer connection to a new user by calling them
  connectToNewUser(userData, stream) {
    const { userID } = userData;
    // call new the user that joined the room
    const call = this.myPeer.call(userID, stream, {
      metadata: { id: this.myID },
    });
    // create new video for the new user that joined
    call.on("stream", (userVideoStream) => {
      this.createVideo({ id: userID, stream: userVideoStream, userData });
    });
    // close video when user leaves or error occurs
    call.on("close", () => {
      this.removeVideo(userID);
    });
    call.on("error", () => {
      this.removeVideo(userID);
    });
    this.peers[userID] = call;

    this.connect = this.myPeer.connect(userID);
    this.connect.on("open", () => {
      this.connected = true;

      this.connect.on("error", (err) => {
        console.log(err);
      });
    });
  }

  createNewMessage(data) {
    const { author, message } = data;
    const latestMessage = document.getElementById("chats");
    const newMessage = document.createElement("p");
    const name = document.createElement("span");
    name.className = "author";
    name.innerHTML = author;
    newMessage.append(name);
    newMessage.innerHTML += "<br>" + message;
    newMessage.className = `receivedMessage`;
    latestMessage.append(newMessage);
  }

  sendData(data) {
    this.socket.emit("message", { message: data, author: this.name });
  }

  // remove video
  removeVideo = (id) => {
    delete this.videoContainer[id];
    const video = document.getElementById(id);
    if (video) video.remove();
  };

  toggleCamera = () => {
    const myMediaTracks = this.streamObject.getTracks();
    myMediaTracks[1].enabled = !myMediaTracks[1].enabled; // Stops the camera.
  };

  toggleAudio = () => {
    const myMediaTracks = this.streamObject.getTracks();
    myMediaTracks[0].enabled = !myMediaTracks[0].enabled; // Stops the audio.
  };

  // close peer connection
  destoryConnection = () => {
    const myMediaTracks = this.streamObject.getTracks();
    myMediaTracks?.forEach((track) => {
      track.stop();
    });
    this.socket.disconnect();
    this.myPeer.destroy();
  };

  updateScreen() {
    let numUsers = Object.keys(this.videoContainer).length;

    // If the number of users in the room is more than 1, then we divide up the region into blocks
    if (numUsers <= 1) {
      let video = document.getElementById(this.myID);
      video.className = "active";
    } else {
      // Your block will be the smallest
      let video = document.getElementById(this.myID);
      video.className = "owner";

      for (let item in this.videoContainer) {
        if (item !== this.myID) {
          let video = document.getElementById(item);
          video.className = "active";
        }
      }
    }
  }

  // SCREEN SHARE FUNCTIONS

  // set and return video and audio media stream
  getScreenStream = (video = true, audio = true) => {
    let quality = this.settings.params?.quality;
    if (quality) {
      quality = parseInt(quality);
    }
    const mediaDevices = navigator.mediaDevices;
    return mediaDevices.getDisplayMedia({
      video: video
        ? {
            frameRate: quality ? quality : 12,
            noiseSuppression: true,
            width: 2000,
            height: 1000,
          }
        : false,
      audio: audio,
    });
  };

  // reinitialize media stream for screen share or video share
  reInitializeStream = (video, audio, type = "userMedia") => {
    let media;
    this.isScreenSharing = !this.isScreenSharing;
    if (type === "userMedia") {
      // get webcam media track
      media = this.getVideoAudioStream(video, audio);
    } else {
      // get screen share media track
      let displayMediaOptions = {
        video: {
          cursor: "always",
          width: 2000,
          height: 1000,
        },
        audio: false,
      };
      media = navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    }

    return new Promise((resolve, reject) => {
      media
        .then((stream) => {
          this.streamObject = stream;
          // close previous media track
          this.closeVideoTrack();
          // create new media track
          this.createVideo({ id: this.myID, stream });
          // notify connected peer users of new media track
          this.replaceStream(stream);
          resolve(stream);
        })
        .catch(() => {
          this.isScreenSharing = !this.isScreenSharing;
        });

      media.catch((err) => {
        reject();
      });
    });
  };

  // get user's own media track
  getMyVideo = () => {
    return document.getElementById(this.myID);
  };

  // to turn off the current video track
  closeVideoTrack = () => {
    const myVideo = this.getMyVideo();
    if (myVideo) {
      if ("getVideoTracks" in myVideo.srcObject) {
        myVideo.srcObject.getVideoTracks().forEach((track) => {
          if (track.kind === "video") {
            track.stop();
          }
        });
      }
    }
  };

  // to replace and send the new media track to connected peer users
  replaceStream = (mediaStream) => {
    Object.values(this.peers).forEach((peer) => {
      peer.peerConnection?.getSenders().forEach((sender) => {
        if (sender.track.kind === "audio") {
          if (mediaStream.getAudioTracks().length > 0) {
            sender.replaceTrack(mediaStream.getAudioTracks()[0]);
          }
        }
        if (sender.track.kind === "video") {
          if (mediaStream.getVideoTracks().length > 0) {
            sender.replaceTrack(mediaStream.getVideoTracks()[0]);
          }
        }
      });
    });
  };
}

export function createSocketConnectionInstance(settings = {}) {
  return new Connection(settings);
}
