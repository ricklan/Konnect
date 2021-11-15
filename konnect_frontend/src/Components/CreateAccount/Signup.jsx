import { Formik, Form } from "formik";
import { Button, TextField } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import * as Yup from "yup";
import axios from "axios";

import "../../Global/Global.css";
import "./Signup.css";

const APISignup = (data) => {
  axios
    .post(`${process.env.REACT_APP_URL}/api/signup/`, data, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, //! must set this to interact with session
    })
    .then(function (response) {
      window.location = `/home/${response.data}/`;
    })
    .catch(function (error) {
      let signup = document.getElementById("signup");
      signup.innerHTML = `Error ${error.response.status}: ${error.response.data.error}`;
    });
};

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

  signUpButton: {
    margin: theme.spacing(1),
    borderColor: "#00bcd4",
    backgroundColor: "#00bcd4",
    color: "black",
    width: "80%",
    textAlign: "center",
  },
}));

function Signup() {
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
    <div className="signup">
      <p id="signup" className="error"></p>
      <Formik
        initialValues={{
          firstname: "",
          lastname: "",
          username: "",
          password: "",
        }}
        validateOnChange={true}
        validationSchema={validate}
        onSubmit={(values, { setSubmitting }) => {
          APISignup(values);

          setTimeout(() => {
            setSubmitting(false);
          }, 400);
        }}
      >
        {({ handleChange, errors, touched }) => (
          <Form className={classes.form}>
            <h1>Create Account</h1>

            {errors.firstname && touched.firstname ? (
              <div>{errors.firstname}</div>
            ) : null}
            <TextField
              id="firstname"
              label="First Name"
              variant="outlined"
              onChange={handleChange}
              required
            />

            {errors.lastname && touched.lastname ? (
              <div>{errors.lastname}</div>
            ) : null}
            <TextField
              id="lastname"
              label="Last Name"
              variant="outlined"
              onChange={handleChange}
              required
            />

            {errors.username && touched.username ? (
              <div>{errors.username}</div>
            ) : null}
            <TextField
              id="username"
              label="Username"
              variant="outlined"
              onChange={handleChange}
              required
            />

            {errors.password && touched.password ? (
              <div>{errors.password}</div>
            ) : null}
            <TextField
              id="password"
              type="Password"
              label="Password"
              variant="outlined"
              onChange={handleChange}
              required
            />

            <Button
              type="submit"
              variant="outlined"
              size="large"
              color="primary"
              className={classes.signUpButton}
            >
              Signup
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default Signup;
