import React from "react";
import AppBar from "@material-ui/core/AppBar/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import logo from "../../../asset/images/logo.svg";

const useStyles = makeStyles((theme) => createStyles({
    root: {
            boxShadow: '0 0 0 0',
    },
    logo: {
        [theme.breakpoints.up("xs")]: {
            height: "60px"
        },
        [theme.breakpoints.down("xs")]: {
            height: "52px"
        }
    }
}));

export const HeaderLogo = () => {
    const classes = useStyles();
    return (
        <AppBar position="static" color="transparent" className={classes.root}>
            <Toolbar>
                <img alt="logo-reef-supervisor" className={classes.logo} src={logo}>
                </img>
            </Toolbar>
        </AppBar>
    )
};