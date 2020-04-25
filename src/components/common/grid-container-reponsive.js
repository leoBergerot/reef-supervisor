import React from "react";
import {createStyles, makeStyles} from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import {HeaderLogo} from "./header-logo";

const useStyles = makeStyles((theme) => createStyles({
    firstStyle: {
        zIndex:1000,
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFF !important",
        [theme.breakpoints.down("xs")]: {
            top: "56px",
        },
        [theme.breakpoints.up("sm")]: {
            top: "64px",
        },
        [theme.breakpoints.up("md")]: {
            top: "64px",
            height: "calc(100% - 64px)",
        }
    },
    secondStyle: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFF !important",
        [theme.breakpoints.down("xs")]: {
            top:"56px",
            height: "calc(100% - 56px)",
        },
        [theme.breakpoints.up("sm")]: {
            top: "64px",
            height: "calc(100% - 64px)",
        }
    }
}));

export const GridContainerResponsive = ({children, baseline}) => {

    const classes = useStyles();

    return (
        <>
            <HeaderLogo/>
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
                className={(baseline ? classes.firstStyle : classes.secondStyle)}
            >
                {children}
            </Grid>
        </>
    )
};