import { Button, TextField } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import EditIcon from "@material-ui/icons/Edit";
import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";

import { homepage, getName } from "../../API/api";
import "../../Global/Global.css";
import "./Home.css";
import NavBar from "./navbar";
import { useCallback } from "react";

const useStyles = makeStyles((theme) => ({
  form: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minWidth: "15%",
    marginLeft: "auto",
    marginRight: "auto",
    overflow: "hidden",
    padding: "2%",
    borderRadius: "16px",
    backgroundColor: "wheat",
    "& .MuiTextField-root": {
      margin: theme.spacing(1),
      width: "80%",
    },
    "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
      borderColor: "black",
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#00bcd4",
    },
    [theme.breakpoints.down("sm")]: {
      marginBottom: "5%",
      padding: "4%",
    },
  },

  signUpButton: {
    margin: theme.spacing(1),
    borderColor: "#00bcd4",
    backgroundColor: "#00bcd4",
    color: "black",
    width: "80%",
    textAlign: "center",
  },
}));

export const editProfileInfo = (data) => {
  axios
    .put(`${process.env.REACT_APP_URL}/api/editProfile/${data.id}/`, data, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, //! must set this to interact with session
    })
    .then(function (response) {
      window.location = `/home/${response.data.user._id}/`;
    })
    .catch(function (error) {
      let profile = document.getElementById("profile");
      let errorMessage = document.createElement("p");
      errorMessage.className = "error";
      if (error.response) {
        errorMessage.innerHTML = `Error: ${error.response.data.error}`;
      } else {
        errorMessage.innerHTML = error;
      }

      profile.prepend(errorMessage);
    });
};

function Home() {
  const [data, setData] = useState({
    firstname: "",
    lastname: "",
    username: "",
    password: "",
  });

  const [editProfileValue, setEditProfileValue] = useState(false);
  let id = window.location.pathname.split("/")[2]; // Gets the user's id

  const cancelEdit = () => {
    fetch();
    editProfile();
  };

  // Gets the user's profile data
  const fetch = useCallback(() => {
    homepage(id)
      .then((data) => {
        setData(data);
      })
      .catch((error) => {
        let profile = document.getElementById("profile");
        let errorMessage = document.createElement("p");
        errorMessage.className = "error";
        if (error.response) {
          errorMessage.innerHTML = `Error: ${error.response.data.error}`;
        } else {
          errorMessage.innerHTML = error;
        }

        profile.prepend(errorMessage);
      });
  }, [id]);

  useEffect(() => {
    getName().then((data) => {
      if (data.name) {
        fetch();
      } else {
        window.location.href = "/";
      }
    });
  }, [fetch]);

  function editProfile() {
    setEditProfileValue(!editProfileValue);
  }

  const classes = useStyles();
  const validate = Yup.object({
    firstname: Yup.string()
      .max(15, "Must be 15 characters or less")
      .matches(/^[a-zA-Z]*$/, "Must be only letters"),
    lastname: Yup.string()
      .max(15, "Must be 15 characters or less")
      .matches(/^[a-zA-Z]*$/, "Must be only letters"),
    username: Yup.string()
      .min(6, "Username must be at least 6 charaters")
      .matches(/^[a-zA-Z]*$/, "Must be only letters"),
    password: Yup.string()
      .min(8, "Password must be at least 8 charaters")
      .matches(/^[a-zA-Z]*$/, "Must be only letters"),
  });

  return (
    <div className="home">
      <NavBar></NavBar>

      <div id="profile">
        <h1 className="title">
          Welcome to your homepage {data.firstname} {data.lastname}
        </h1>

        {editProfileValue ? (
          <Formik
            enableReinitialize
            initialValues={{
              firstname: data.firstname,
              lastname: data.lastname,
              username: data.username,
              password: data.password,
            }}
            validateOnChange={true}
            validationSchema={validate}
            onSubmit={(values, { setSubmitting }) => {
              values.id = id;
              editProfileInfo(values);

              setTimeout(() => {
                setSubmitting(false);
              }, 400);
            }}
          >
            {({ errors }) => (
              <Form className={classes.form}>
                {errors.firstname ? <div>{errors.firstname}</div> : null}
                <TextField
                  id="firstname"
                  label="First Name"
                  variant="outlined"
                  value={data.firstname}
                  onChange={(e) =>
                    setData({ ...data, firstname: e.target.value })
                  }
                  required
                />
                {errors.lastname ? <div>{errors.lastname}</div> : null}
                <TextField
                  id="lastname"
                  label="Last Name"
                  variant="outlined"
                  value={data.lastname}
                  onChange={(e) =>
                    setData({ ...data, lastname: e.target.value })
                  }
                  required
                />
                {errors.username ? <div>{errors.username}</div> : null}
                <TextField
                  id="username"
                  label="Username"
                  variant="outlined"
                  value={data.username}
                  onChange={(e) =>
                    setData({ ...data, username: e.target.value })
                  }
                  required
                />
                {errors.password ? <div>{errors.password}</div> : null}
                <TextField
                  id="password"
                  type="Password"
                  label="Password"
                  variant="outlined"
                  value={data.password}
                  onChange={(e) =>
                    setData({ ...data, password: e.target.value })
                  }
                  required
                />

                <Button
                  variant="outlined"
                  type="submit"
                  size="large"
                  color="primary"
                  className={classes.signUpButton}
                >
                  Save
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  color="primary"
                  className={classes.signUpButton}
                  onClick={() => cancelEdit()}
                >
                  Cancel
                </Button>
              </Form>
            )}
          </Formik>
        ) : (
          <Formik>
            <Form className={classes.form}>
              <TextField
                id="firstname"
                label="First Name"
                variant="outlined"
                value={data.firstname}
                disabled
              />

              <TextField
                id="lastname"
                label="Last Name"
                variant="outlined"
                value={data.lastname}
                disabled
              />

              <TextField
                id="username"
                label="Username"
                variant="outlined"
                value={data.username}
                disabled
              />

              <TextField
                id="password"
                type="Password"
                label="Password"
                variant="outlined"
                value={data.password}
                disabled
              />

              <Button
                variant="outlined"
                size="large"
                color="primary"
                className={classes.signUpButton}
                onClick={() => editProfile()}
              >
                <EditIcon></EditIcon> Edit Profile
              </Button>
            </Form>
          </Formik>
        )}
      </div>
    </div>
  );
}

export default Home;
