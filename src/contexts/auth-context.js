import React, {createContext, useContext, useEffect, useState} from 'react';
import jwt_decode from "jwt-decode";
import {alertContext} from "./alert-context";
import {useTranslation} from "react-i18next";

export const EXPIRED = "expired";

export const authContext = createContext({});

const AuthProvider = ({children, history}) => {
    const {setAlert} = useContext(alertContext);
    const [auth, setAuth] = useState({loading: true, token: null});
    const {t} = useTranslation();

    const setAuthData = (token) => {
        setAuth({token: token});
    };

    const getAuthToken = () => {
        if (auth.token) {
            if (jwt_decode(auth.token).exp > Date.now().valueOf() / 1000) {
                return auth.token
            } else {
                setAuthData(null);
                history.replace('/login');
                setAlert({
                    open: true,
                    message: t('error.expired_session'),
                    severity: 'warning'
                });
                return EXPIRED;
            }
        }
        return false;
    };

    useEffect(() => {
        setAuth({
            loading: false,
            token: window.localStorage.getItem('authData') !== "undefined" ? JSON.parse(window.localStorage.getItem('authData')) : null
        });
    }, []);

    useEffect(() => {
        window.localStorage.setItem('authData', JSON.stringify(auth.token));
    }, [auth.token]);

    return (
        <authContext.Provider
            value={{getAuthToken, setAuthData, auth}}
        >
            {children}
        </authContext.Provider>
    );
};

export default AuthProvider;
