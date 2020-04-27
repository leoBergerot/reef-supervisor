import React from "react";
import {Header} from "./header";
import makeStyles from "@material-ui/core/styles/makeStyles";
import CircularProgress from "@material-ui/core/CircularProgress/CircularProgress";

const useStyles = makeStyles((theme) => ({
    root: {
        position: "absolute",
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
        bottom:0,
        right:0,
        left:0
    },
    loading: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%"
    }
}));

export const Main = ({children, history, loading}) => {

    const classes = useStyles();

    return (
        <>
            <Header history={history}>
            </Header>
            <div className={classes.root}>
                {loading ?
                    <div className={classes.loading}>
                        <CircularProgress/>
                    </div> :
                    children
                }
            </div>
        </>
    )
};