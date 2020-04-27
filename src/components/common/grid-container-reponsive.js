import React from "react";
import Grid from "@material-ui/core/Grid";
import {makeStyles} from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
    root: {
        "height": fullHeight => fullHeight.fullHeight ? "90%" : "default"
    }
}));

export const GridContainerResponsive = ({children, fullHeight}) => {
    const classes = useStyles({fullHeight});
    return (
        <>
            <Grid
                className={classes.root}
                container
                direction="row"
                justify="center"
                alignItems="center"
            >
                {children}
            </Grid>
        </>
    )
};