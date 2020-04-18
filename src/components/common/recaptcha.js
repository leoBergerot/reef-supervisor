import React, {useEffect} from "react";
import PropTypes from 'prop-types';


export const Recaptcha = ({responseCallback, setCaptchaReady, submit}) => {

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://www.google.com/recaptcha/api.js";
        script.async = true;
        script.defer = true;
        script.onload = (() => {
            onLoad()
        });
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script)
        }
    }, []);

    useEffect(() => {
        if (submit) {
            window.grecaptcha.execute();
        }
    }, [submit]);

    const onLoad = () => {
        setTimeout(function () {
                if (typeof grecaptcha === 'undefined' || typeof window.grecaptcha.render === 'undefined') {
                    onLoad();
                } else {
                    window.grecaptcha.render('recaptcha', {
                        sitekey: process.env.REACT_APP_RECAPTCHA_KEY_SITE,
                        size: 'invisible',
                        callback: (token) => {
                            window.grecaptcha.reset();
                            responseCallback(token);
                        }
                    });
                    setCaptchaReady(true);
                }
            }
            , 100)
    };

    return (
        <div id="recaptcha"/>
    )
};

Recaptcha.propTypes = {
    submit: PropTypes.bool,
    setReady: PropTypes.func,
    responseCallback: PropTypes.func
};