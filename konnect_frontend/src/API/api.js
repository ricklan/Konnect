import axios from "axios";

export const signout = () => {
  axios
    .get(`${process.env.REACT_APP_URL}/api/signout/`, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, //! must set this to interact with session
    })
    .then(function (response) {
      window.location = `/`;
    });
};

export const homepage = (data) => {
  return new Promise((resolve, reject) => {
    let result = axios.get(
      `${process.env.REACT_APP_URL}/api/getHomeData/${data}/`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true, //! must set this to interact with session
      }
    );
    result
      .then((response) => resolve(response.data))
      .catch((error) => reject(error));
  });
};

export const createMeeting = () => {
  axios
    .get(`${process.env.REACT_APP_URL}/api/createRoom/`, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, //! must set this to interact with session
    })
    .then(function (response) {
      window.location = `/room/${response.data.room.id}/`;
    })
    .catch(function (error) {
      window.location = `/error/${error.response.status}/?message=${error.response.data.error}`;
    });
};

export const getUserId = () => {
  axios
    .get(`${process.env.REACT_APP_URL}/api/userId/`, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, //! must set this to interact with session
    })
    .then(function (response) {
      window.location = `/home/${response.data.id}/`;
    })
    .catch(function (error) {
      window.location = `/error/${error.response.status}/?message=${error.response.data.error}`;
    });
};

export const getName = () => {
  return new Promise((resolve, reject) => {
    let result = axios.get(`${process.env.REACT_APP_URL}/api/userName/`, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, //! must set this to interact with session
    });
    result
      .then((response) => resolve(response.data))
      .catch((error) => reject(error));
  });
};
