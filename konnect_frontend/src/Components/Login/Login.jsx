import { Formik, Form } from "formik";
import { Button, TextField } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import * as Yup from "yup";
import axios from "axios";

import "../../Global/Global.css";
import "./Login.css";

const useStyles = makeStyles((theme) => ({
  form: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minWidth: "15%",
    minHeight: "30%",
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
  },

  loginButton: {
    margin: theme.spacing(1),
    borderColor: "#00bcd4",
    backgroundColor: "#00bcd4",
    color: "black",
    width: "80%",
    textAlign: "center",
  },

  signUpButton: {
    margin: theme.spacing(1),
    borderColor: "white",
    backgroundColor: "white",
    color: "black",
    width: "80%",
    textAlign: "center",
  },
}));

const APISignin = (data) => {
  axios
    .post(`${process.env.REACT_APP_URL}/api/signin/`, data, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, //! must set this to interact with session
    })
    .then(function (response) {
      window.location = `/home/${response.data}/`;
    })
    .catch(function (error) {
      let login = document.getElementById("login");
      login.innerHTML = `Error ${error.response.status}: ${error.response.data.error}`;
    });
};

function Login() {
  const classes = useStyles();

  const validate = Yup.object({
    username: Yup.string().matches(/^[a-zA-Z]*$/, "Must be only letters"),
    password: Yup.string().matches(/^[a-zA-Z]*$/, "Must be only letters"),
  });

  return (
    <div className="login">
      <p id="login" className="error"></p>

      <Formik
        initialValues={{ username: "", password: "" }}
        validationSchema={validate}
        onSubmit={(values, { setSubmitting }) => {
          APISignin(values);

          setTimeout(() => {
            setSubmitting(false);
          }, 400);
        }}
      >
        {({ handleChange }) => {
          return (
            <Form className={classes.form}>
              <h1>Login</h1>
              <TextField
                id="username"
                label="Username"
                variant="outlined"
                required
                onChange={handleChange}
              />
              <TextField
                id="password"
                type="Password"
                label="Password"
                variant="outlined"
                required
                onChange={handleChange}
              />

              <Button
                type="submit"
                variant="outlined"
                size="large"
                color="primary"
                className={classes.loginButton}
              >
                Login
              </Button>

              <Button
                variant="outlined"
                size="large"
                color="primary"
                href="/Signup"
                className={classes.signUpButton}
              >
                Signup
              </Button>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}

export default Login;
