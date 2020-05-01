import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import * as serviceWorker from './serviceWorker';
import '../asset/scss/app.scss';
import AuthProvider from "./contexts/auth-context";
import AlertProvider from "./contexts/alert-context";
import {ContextProviderComposer} from "./contex-provider-composer";
import TankProvider from "./contexts/tank-context";
import TypeProvider from "./contexts/type-context";

ReactDOM.render(
      <ContextProviderComposer contextProviders={[
          <AuthProvider key={0}/>,
          <AlertProvider key={1}/>,
          <TankProvider key={2}/>,
          <TypeProvider key={3}/>
          ]}>
          <App/>
      </ContextProviderComposer>,
  document.getElementById('root')
);

serviceWorker.unregister();
