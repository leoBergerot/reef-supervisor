import React from 'react';
import {BrowserRouter, Route, Switch} from "react-router-dom";
import {Login} from "./components/auth/login";
import {Home} from "./components/home/home";
import {GuardRoute} from "./components/guard/route-guard";
import {ForgotPassword} from "./components/auth/forgot-password";
import {RecoverPassword} from "./components/auth/recover-password";
import {Register} from "./components/auth/register";
import {List} from "./components/tanks/list";
import {ThemeProvider} from "@material-ui/styles";
import {createMuiTheme} from "@material-ui/core";

const theme = createMuiTheme({
    palette: {
        primary: {
            light: "#42b3e4",
            main: "#13A1DE",
            dark: "#0d709b",
        },
        text: {
            primary: "#57595B"
        }
    }
});

function App() {
  return (
      <ThemeProvider key={3} theme={theme}>
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
      </ThemeProvider>
  );
}

export default App;
