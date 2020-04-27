import React from 'react';
import {Route, Router, Switch} from "react-router-dom";
import {Login} from "./components/auth/login";
import {Home} from "./components/home/home";
import {GuardRoute} from "./components/guard/route-guard";
import {ForgotPassword} from "./components/auth/forgot-password";
import {RecoverPassword} from "./components/auth/recover-password";
import {Register} from "./components/auth/register";
import {List} from "./components/tanks/list";
import {ThemeProvider} from "@material-ui/styles";
import {createMuiTheme} from "@material-ui/core";
import {MuiPickersUtilsProvider} from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import {Measures} from "./components/list/measures";
import {Layout} from "./components/common/layout";
import history from "./components/common/history";

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
    const constHistory = history;
  return (
      <ThemeProvider theme={theme}>
          <MuiPickersUtilsProvider utils={MomentUtils}>
          <div className="app">
              <Router history={constHistory}>
                  <Switch>
                      <Layout history={constHistory}>
                          <Route path="/login/:enable?" component={Login}/>
                          <Route path="/forgot-password" component={ForgotPassword}/>
                          <Route path="/recover-password/:id/:token" component={RecoverPassword}/>
                          <Route path="/register" component={Register}/>
                          <GuardRoute exact path="/" component={Home}/>
                          <GuardRoute exact path="/tanks/:manage?" component={List}/>
                          <GuardRoute exact path="/measures" component={Measures}/>
                      </Layout>
                  </Switch>
              </Router>
          </div>
          </MuiPickersUtilsProvider>
      </ThemeProvider>
  );
}

export default App;
