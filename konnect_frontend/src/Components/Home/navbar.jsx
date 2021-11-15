import Button from "@material-ui/core/Button";
import { makeStyles } from "@material-ui/core/styles";

import { signout, createMeeting } from "../../API/api";

import "./Navbar.css";
import "../../Global/Global.css";

const useStyles = makeStyles((theme) => ({
  button: {
    color: "white",
    marginRight: "30px",
    marginLeft: "30px",

    "&:hover": {
      backgroundColor: "white",
      color: "black",
    },

    [theme.breakpoints.down("sm")]: {
      fontSize: "1rem",
    },
    [theme.breakpoints.down("md")]: {
      fontSize: "2rem",
    },
    [theme.breakpoints.down("lg")]: {
      fontSize: "2rem",
    },
  },
}));

function NavBar() {
  let id = window.location.pathname.split("/")[2]; // Gets the user's id
  const classes = useStyles();

  return (
    <div className="navbar">
      <Button className={classes.button} href={`/home/${id}`}>
        Home
      </Button>

      <Button className={classes.button} onClick={() => createMeeting()}>
        Create New Meeting
      </Button>

      <Button onClick={signout} className={classes.button}>
        Signout
      </Button>
    </div>
  );
}

export default NavBar;
