import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import * as serviceWorker from './serviceWorker';
import '../asset/scss/app.scss';
import AuthProvider from "./contexts/auth-context";
import AlertProvider from "./contexts/alert-context";
import {ContextProviderComposer} from "./contex-provider-composer";
import TankProvider from "./contexts/tank-context";
import {ThemeProvider} from '@material-ui/core/styles';
import {createMuiTheme} from "@material-ui/core";

const theme = createMuiTheme({
    palette: {
        primary: {
            light: "#42b3e4",
            main: "#13A1DE",
            dark: "#0d709b",
        },
        text: {
            primary:"#57595B"
        }
    }
});

ReactDOM.render(
  <React.StrictMode>
      <ContextProviderComposer contextProviders={[
          <AuthProvider key={0}/>,
          <AlertProvider key={1}/>,
          <TankProvider key={2}/>,
          <ThemeProvider key={3} theme={theme}/>
      ]}>
          <App/>
      </ContextProviderComposer>
  </React.StrictMode>,
  document.getElementById('root')
);

serviceWorker.register();
