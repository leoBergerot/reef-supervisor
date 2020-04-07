import React from 'react';
import {BrowserRouter, Route, Switch} from "react-router-dom";
import {Login} from "./components/auth/login";
import {Home} from "./components/home/home";
import {GuardRoute} from "./components/guard/route-guard";
import {ForgotPassword} from "./components/auth/forgot-password";
import {RecoverPassword} from "./components/auth/recover-password";

function App() {
  return (
      <div className="app">
          <BrowserRouter>
              <Switch>
                  <Route path="/login" component={Login}/>
                  <Route path="/forgot-password" component={ForgotPassword}/>
                  <Route path="/recover-password/:id/:token" component={RecoverPassword}/>
                  <GuardRoute path="/" component={Home}/>
              </Switch>
          </BrowserRouter>
    </div>
  );
}

export default App;
