import React, {createContext, useContext, useEffect, useState} from 'react';
import {tankContext} from "./tank-context";
import {typeContext} from "./type-context";

export const authContext = createContext({});

const AuthProvider = ({children}) => {
    const [auth, setAuth] = useState({loading: true, token: null});

    const setAuthData = (token) => {
        setAuth({token: token});
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
            value={{auth, setAuthData}}
        >
            {children}
        </authContext.Provider>
    );
};

export default AuthProvider;
