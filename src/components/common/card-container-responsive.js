import React from "react";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";


const useStyles = makeStyles((theme) => createStyles({
    root: {
        [theme.breakpoints.down("xs")]: {
            boxShadow: '0 0 0 0',
            padding: "0 !important",
            width: "100vw !important"
        },
        [theme.breakpoints.up("xs")]: {
            width: "348px",
            padding: "4rem 2rem 7rem 2rem"
        }
    }
}));


export const CardContainerReponsive = ({children}) => {
    const classes = useStyles();
    return (
        <Card className={classes.root}>
            {children}
        </Card>
    )
};

