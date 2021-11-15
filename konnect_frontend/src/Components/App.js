import { Switch, Route, Redirect } from "react-router-dom";
import Login from "./Login/Login.jsx";
import Signup from "./CreateAccount/Signup.jsx";
import Home from "./Home/home.jsx";
import Room from "./Room/room.jsx";
import Error from "./Error/error.jsx";

// this component deals with all routing.
export default function App() {
  return (
    <div id="host">
      <Switch>
        {/*  route definitions */}
        <Route exact={true} path="/login">
          <Login></Login>
        </Route>

        <Route exact={true} path="/signup">
          <Signup></Signup>
        </Route>

        <Route exact={true} path="/home/:id">
          <Home></Home>
        </Route>

        <Route exact={true} path="/room/:id">
          <Room></Room>
        </Route>

        <Route path="/error/:statuscode/">
          <Error></Error>
        </Route>

        <Route path="/">
          {/* on any undefined path, redirect to dashboard (dashboard will redirect to login if no auth)*/}
          <Redirect to={"/login"} />
        </Route>
      </Switch>
    </div>
  );
}
