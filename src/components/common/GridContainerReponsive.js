import React from "react";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";

const useStyles = makeStyles((theme) => createStyles({
    root: {
        [theme.breakpoints.up("sm")]: {
            height: "100vh"
        },
    }
}));

export const GridContainerResponsive = ({children}) => {

    const classes = useStyles();

    return (
        <Grid
            container
            direction="row"
            justify="center"
            alignItems="center"
            className={classes.root}
        >
            {children}
        </Grid>
    )
};