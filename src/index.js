import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import * as serviceWorker from './serviceWorker';
import '../asset/scss/app.scss';
import AuthProvider from "./contexts/auth-context";
import AlertProvider from "./contexts/alert-context";
import {ContextProviderComposer} from "./contex-provider-composer";
import TankProvider from "./contexts/tank-context";

ReactDOM.render(
  <React.StrictMode>
      <ContextProviderComposer contextProviders={[
          <AuthProvider key={0}/>,
          <AlertProvider key={1}/>,
          <TankProvider key={2}/>,
      ]}>
          <App/>
      </ContextProviderComposer>
  </React.StrictMode>,
  document.getElementById('root')
);

serviceWorker.register();
