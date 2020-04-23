import Paper from "@material-ui/core/Paper/Paper";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlus} from "@fortawesome/free-solid-svg-icons";
import React, {useEffect, useState} from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";

const useStyles = makeStyles(theme => ({
    paper: {
        [theme.breakpoints.up("xs")]: {
            height: "20vw",
            width: "20vw",
            margin: "1rem auto 1rem auto",
        },
        [theme.breakpoints.down("xs")]: {
            height: "40vw",
            width: "40vw",
            margin: "0.5rem auto 0.5rem auto",
        },
    },
    container: {
        height: "100%"
    },
    subtitle2: {
        height: "48px",
        [theme.breakpoints.up("xs")]: {
            fontSize: "2vw"
        },
        [theme.breakpoints.down("xs")]: {
            fontSize: "4vw"
        }
    },
    subtitle1: {
        [theme.breakpoints.up("xs")]: {
            fontSize: "3vw"
        },
        [theme.breakpoints.down("xs")]: {
            fontSize: "6vw"
        }
    },
    root: {
        float: "right"
    }
}));

export const Measure = ({name, shortName, unit}) => {
    const classes = useStyles();

    return (
        <Grid item xs={6} sm={3}>
            <Paper className={classes.paper}>
                <Grid
                    container
                    direction="column"
                    className={classes.container}
                >
                    <Grid item>
                        <Typography align="center" variant="subtitle2" className={classes.subtitle2}>
                            {name} ({shortName})
                        </Typography>
                    </Grid>
                    <Grid item style={{margin: "auto"}}>
                        <Typography align="center" variant="subtitle1" className={classes.subtitle1}>
                            - - {unit}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <IconButton color="primary" aria-label={`Add ${name} parameter`} className={classes.root}>
                            <FontAwesomeIcon icon={faPlus}/>
                        </IconButton>
                    </Grid>
                </Grid>
            </Paper>
        </Grid>
    )
};