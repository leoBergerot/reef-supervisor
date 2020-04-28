import {makeStyles} from "@material-ui/core/styles";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import React from "react";

const useToolbarStyles = makeStyles((theme) => ({
    title: {
        flex: '1 1 100%',
    }
}));

export const ToolbarList = ({type}) => {
    const classes = useToolbarStyles();

    return (
        <Toolbar>
            <Typography variant="overline" className={classes.title}>
                {type.data.name} values list
            </Typography>
        </Toolbar>
    );
};