import React from "react";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import {HeaderLogo} from "./header-logo";

const useStyles = makeStyles((theme) => createStyles({
    root: {
        overflow: "scroll",
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFF !important",
        [theme.breakpoints.up("sm")]: {
            top: "64px",
        },
        [theme.breakpoints.down("sm")]: {
            top: "56px",
        },
    }
}));

export const GridContainerResponsive = ({children}) => {

    const classes = useStyles();

    return (
        <>
            <HeaderLogo/>
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
                className={classes.root}
            >
                {children}
            </Grid>
        </>
    )
};