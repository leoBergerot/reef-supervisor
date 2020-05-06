import React, {useContext} from 'react';
import {Redirect, Route} from 'react-router-dom';
import {authContext} from "../../contexts/auth-context";
import {tankContext} from "../../contexts/tank-context";
import {List} from "../tanks/list";
import {Loading} from "../common/loading";

export const GuardRoute = ({ component: Component, ...rest }) => {
    const {getAuthToken, auth} = useContext(authContext);
    const {tank} = useContext(tankContext);
    if (auth.loading) {
        return (
            <Route
                {...rest}
                render={() => (
                    <Loading loading={auth.loading || tank.loading}/>
                )}
            />
        );
    }
    console.log(!tank.data);
    return (
        <Route
            {...rest}
            render={(routeProps) => (
                getAuthToken() ? (!tank.data ?
                    <List {...routeProps} /> : <Component {...routeProps} />) : <Redirect to="/login"/>
            )
            }
        />)
};