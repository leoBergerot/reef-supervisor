import React, { useContext } from 'react';
import { Route, Redirect } from 'react-router-dom';
import {authContext} from "../../contexts/auth-context";
import jwt_decode from 'jwt-decode'

export const GuardRoute = ({ component: Component, ...rest }) => {
    const {auth} = useContext(authContext);
    const { loading } = auth;

    if (loading) {
        return (
            <Route
                {...rest}
                render={() => {
                    return <p>Loading...</p>;
                }}
            />
        );
    }
    return (
        <Route
            {...rest}
            render={(routeProps) => (
                auth.token && jwt_decode(auth.token).exp > Date.now().valueOf() / 1000 ? <Component {...routeProps} /> : <Redirect to="/login"/>
            )}
        />)
};