import React from "react";
import AppBar from "@material-ui/core/AppBar/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import {makeStyles} from "@material-ui/core/styles";
import logo from "../../../asset/images/logo.svg";
import {LanguageSelect} from "./language-select";

const useStyles = makeStyles((theme) => ({
    root: {
            boxShadow: '0 0 0 0 !important',
    },
    containerLogo: {
        flexGrow: 1,
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

export const HeaderLogo = ({displayLanguage}) => {
    const classes = useStyles();

    return (
        <AppBar position="fixed" color="inherit" className={classes.root}>
            <Toolbar>
                <div className={classes.containerLogo}>
                <img alt="logo-reef-supervisor" className={classes.logo} src={logo}>
                </img>
                </div>
                {displayLanguage && (
                    <LanguageSelect />
                )}
            </Toolbar>
        </AppBar>
    )
};