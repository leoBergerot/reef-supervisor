import React, {useContext} from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {HeaderMenu} from "./header-menu";
import {HeaderLogo} from "./header-logo";
import {authContext} from "../../contexts/auth-context";
import {tankContext} from "../../contexts/tank-context";

const useStyles = makeStyles((theme) => ({
    main: {
        [theme.breakpoints.up("xs")]: {
            padding: "1rem"
        },
        [theme.breakpoints.down("xs")]: {
            padding: "0"
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
    const {getAuthToken, auth} = useContext(authContext);
    const {tank} = useContext(tankContext);

    const {loading} = auth;
    const classes = useStyles();
    let header = null;

    if (!loading) {
        switch (pathname) {
            case "/":
            case "/measures":
            case "/chart":
                if (getAuthToken() && tank.data) {
                    header = <HeaderMenu history={history}/>;
                }
                break;
            case "/tanks/manage":
            case "/tanks":
                header = <HeaderLogo displayLanguage={false}/>
                break;
            default:
                header = <HeaderLogo displayLanguage={true}/>
        }
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