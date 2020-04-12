import React from "react";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles((theme) => createStyles({

    root: {
        textAlign: "center",
        [theme.breakpoints.up("sm")]: {
            fontSize: '1.3vw'
        },
        [theme.breakpoints.down("sm")]: {
            fontSize: '12px'
        }
    }
}));

export const TypographyResponsive = ({children, overrideClasses}) => {

    const classes = Object.assign({}, useStyles(), overrideClasses);
    return (
        <Typography className={classes.root}>
            {children}
        </Typography>
    )
};