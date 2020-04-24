import Paper from "@material-ui/core/Paper/Paper";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEllipsisV, faPlus} from "@fortawesome/free-solid-svg-icons";
import React, {useContext, useEffect, useState} from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {authContext} from "../../contexts/auth-context";
import {alertContext} from "../../contexts/alert-context";
import Skeleton from "@material-ui/lab/Skeleton";
import {tankContext} from "../../contexts/tank-context";

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
        margin: "auto",
        [theme.breakpoints.up("xs")]: {
            fontSize: "3vw"
        },
        [theme.breakpoints.down("xs")]: {
            fontSize: "6vw"
        }
    },
}));

export const Measure = ({name, shortName, unit, type}) => {
    const {auth} = useContext(authContext);
    const {tank} = useContext(tankContext);
    const {setAlert} = useContext(alertContext);
    const classes = useStyles();
    const [measure, setMeasure] = useState({last: null, previous: null, loading: true});

    const getMeasureByTypeAndTank = () => {
        setMeasure({last: null, previous: null, loading: true});
        fetch(`${process.env.REACT_APP_API_URL}/measures?tank=${tank.data.id}&limit=2&sort=createdAt,DESC&type=${type}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + auth.token
            },
        })
            .then(res => res.json())
            .then(
                (result) => {
                    setMeasure({
                        last: (result.length >= 0 ? result[0] : null),
                        previous: (result.length >= 1 ? result[1] : null),
                        loading: false
                    });
                },
                (error) => {
                    setMeasure({last: null, previous: null, loading: true});
                    setAlert({
                        open: true,
                        message: `An error occurred`,
                        severity: 'error'
                    });
                }
            );
    };

    useEffect(() => {
        getMeasureByTypeAndTank()
    }, [tank]);

    return (
        <Grid item xs={6} sm={3}>
            <Paper className={classes.paper}>
                {!measure.loading ?
                    <Grid
                    container
                    direction="column"
                    className={classes.container}
                >
                        <Grid item>
                            <Typography align="center" variant="subtitle2" className={classes.subtitle2}>
                                {name} {shortName && `(${shortName})`}
                            </Typography>
                        </Grid>
                        <Grid item style={{margin: "auto"}}>
                            <Typography align="center" variant="subtitle1" className={classes.subtitle1}>
                                {measure.last ? measure.last.value : "- -"} {unit}
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Grid
                                container
                                direction="row"
                                justify="space-between"
                                alignItems="center"
                                style={{position: "relative"}}
                            >
                                <IconButton color="primary" aria-label={`Menu ${name} parameter`}
                                            className={classes.root}>
                                    <FontAwesomeIcon icon={faEllipsisV}/>
                                </IconButton>
                                {measure.previous && (
                                    <Typography align="center" variant="subtitle2" style={{
                                        height: "inherit",
                                        position: "absolute",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        color: (measure.last.value >= measure.previous.value ? "green" : "red")
                                    }} className={classes.subtitle2}>
                                        {`${measure.last.value >= measure.previous.value ? "+" : ""}${(((measure.last.value - measure.previous.value) / measure.previous.value) * 100).toFixed(0)} %`}
                                    </Typography>
                                )}
                                <IconButton color="primary" aria-label={`Add ${name} parameter`}
                                            className={classes.root}>
                                    <FontAwesomeIcon icon={faPlus}/>
                                </IconButton>
                            </Grid>
                        </Grid>
                </Grid>
                    : <Skeleton height="100%" animation="wave" variant="rect"/>}
            </Paper>
        </Grid>
    )
};