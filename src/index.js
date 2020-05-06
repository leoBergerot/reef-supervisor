import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import * as serviceWorker from './serviceWorker';
import '../asset/scss/app.scss';

ReactDOM.render(
    <App/>,
  document.getElementById('root')
);

serviceWorker.unregister();
