import React from "react";
import AppBar from "@material-ui/core/AppBar/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import {createStyles, makeStyles} from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => createStyles({
    root: {
            boxShadow: '0 0 0 0',
    }
}));

export const HeaderLogo = () => {
    const classes = useStyles();
    return (
        <AppBar position="static" color="transparent" className={classes.root}>
            <Toolbar>
                <Typography variant="h6" component="h6">
                    REEF SUPERVISOR
                </Typography>
            </Toolbar>
        </AppBar>
    )
};