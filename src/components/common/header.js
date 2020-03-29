import React, {useContext} from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import {authContext} from "../../contexts/auth-context";
import jwt_decode from 'jwt-decode'
import Typography from "@material-ui/core/Typography";

export const Header = () => {
    const {auth, setAuthData} = useContext(authContext);

    const onLogout = () => {
        setAuthData(null)
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6">
                    {jwt_decode(auth.token).username}
                </Typography>
                <Button onClick={onLogout} color="inherit">Logout</Button>
            </Toolbar>
        </AppBar>
    )
};