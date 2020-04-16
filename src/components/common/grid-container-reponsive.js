import React from "react";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import {HeaderLogo} from "./header-logo";

const noFullHeightSmallStyles = makeStyles((theme) => createStyles({
    root: {
        [theme.breakpoints.up("sm")]: {
            height: "calc(100vh - 64px)",
        }
    }
}));

const fullHeightSmallStyles = makeStyles((theme) => createStyles({
    root: {
        overflow: "scroll",
        backgroundColor: "#FFF !important",
        [theme.breakpoints.up("xs")]: {
            height: "calc(100vh - 64px)",
            alignItems: "center"
        },
        [theme.breakpoints.down("xs")]: {
            height: "calc(100vh - 56px)",
            alignItems: "baseline"
        }
    }
}));

export const GridContainerResponsive = ({children, fullHeightSmall}) => {

    const classes = !fullHeightSmall ? noFullHeightSmallStyles() : fullHeightSmallStyles();

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