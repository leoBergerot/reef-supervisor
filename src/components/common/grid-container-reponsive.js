import React from "react";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import {HeaderLogin} from "./header-login";

const useStyles = makeStyles((theme) => createStyles({
    root: {
        [theme.breakpoints.up("sm")]: {
            height: "calc(100vh - 64px)",
        }
    }
}));

export const GridContainerResponsive = ({children}) => {

    const classes = useStyles();

    return (
        <>
            <HeaderLogin/>
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