import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import * as serviceWorker from './serviceWorker';
import '../asset/scss/app.scss';
import { I18nextProvider } from 'react-i18next';
import i18n from "./i18n";

ReactDOM.render(
    <I18nextProvider i18n={i18n}>
        <App/>
    </I18nextProvider>,
  document.getElementById('root')
);

serviceWorker.register();
