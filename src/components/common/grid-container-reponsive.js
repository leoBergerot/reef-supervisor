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
        [theme.breakpoints.up("sm")]: {
            height: "calc(100vh - 64px)",
        },
        [theme.breakpoints.down("sm")]: {
            height: "calc(70vh - 54px)",
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