import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import * as serviceWorker from './serviceWorker';
import '../asset/scss/app.scss';
import AuthProvider from "./contexts/auth-context";

ReactDOM.render(
  <React.StrictMode>
      <AuthProvider>
    <App />
      </AuthProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

serviceWorker.unregister();
