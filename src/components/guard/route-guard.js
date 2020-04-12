import React, {useContext} from 'react';
import {Redirect, Route} from 'react-router-dom';
import {authContext} from "../../contexts/auth-context";
import jwt_decode from 'jwt-decode'
import {tankContext} from "../../contexts/tank-context";
import {List} from "../tanks/list";

export const GuardRoute = ({ component: Component, ...rest }) => {
    const {auth} = useContext(authContext);
    const {tank} = useContext(tankContext);
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
                auth.token && jwt_decode(auth.token).exp > Date.now().valueOf() / 1000 ? (!tank.data ?
                    <List {...routeProps} /> :
                    <Component {...routeProps} />) : <Redirect to="/login"/>
            )}
        />)
};