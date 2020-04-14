import React from 'react';
import {BrowserRouter, Route, Switch} from "react-router-dom";
import {Login} from "./components/auth/login";
import {Home} from "./components/home/home";
import {GuardRoute} from "./components/guard/route-guard";
import {ForgotPassword} from "./components/auth/forgot-password";
import {RecoverPassword} from "./components/auth/recover-password";
import {Register} from "./components/auth/register";
import {List} from "./components/tanks/list";

function App() {
  return (
      <div className="app">
          <BrowserRouter>
              <Switch>
                  <Route path="/login/:enable?" component={Login}/>
                  <Route path="/forgot-password" component={ForgotPassword}/>
                  <Route path="/recover-password/:id/:token" component={RecoverPassword}/>
                  <Route path="/register" component={Register}/>
                  <GuardRoute path="/tanks/:manage?" component={List}/>
                  <GuardRoute path="/" component={Home}/>
              </Switch>
          </BrowserRouter>
    </div>
  );
}

export default App;
