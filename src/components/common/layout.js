import React, {useContext} from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {HeaderMenu} from "./header-menu";
import {HeaderLogo} from "./header-logo";
import {authContext} from "../../contexts/auth-context";

const useStyles = makeStyles((theme) => ({
    main: {
        [theme.breakpoints.up("xs")]: {
            padding: "1rem"
        },
        [theme.breakpoints.down("xs")]: {
            padding: "1rem 0 1rem 0"
        },
        [theme.breakpoints.down("sm")]: {
            top: "56px"
        },
        [theme.breakpoints.up("sm")]: {
            top: "64px"
        },
        position: "absolute",
        bottom: 0,
        right: 0,
        left: 0,
        overflowY: "scroll",
        "-webkit-overflow-scrolling": "touch"
    }
}));

export const Layout = ({children, location: {pathname}, history}) => {
    const {auth} = useContext(authContext);
    const {loading} = auth;
    const classes = useStyles();
    let header = null;

    switch (pathname) {
        case "/":
        case "/measures":
            header = <HeaderMenu history={history}/>;
            break;
        default:
            header = <HeaderLogo/>
    }
    return (
        <>
            {!loading && (header)}
            <main className={classes.main}>
                {children}
            </main>
        </>
    )
};