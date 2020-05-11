import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {initReactI18next} from 'react-i18next';
import Backend from 'i18next-http-backend';

import translationEng from "./locales/en/translation.json";
import translationFr from "./locales/fr/translation.json";

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next) // bind react-i18next to the instance
    .init({
        fallbackLng: ["en", "fr"],
        debug: true,
        ns: ["translations"],
        defaultNS: "translations",
        interpolation: {
            escapeValue: false, // not needed for react!!
        },
        load: 'languageOnly',
        languages: ["en", "fr"],
        resources: {
            en: {
                translations: translationEng
            },
            fr: {
                translations: translationFr
            }
        }
    });


export default i18n;