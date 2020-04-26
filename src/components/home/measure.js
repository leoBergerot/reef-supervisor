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
import {AddFormWithRef} from "./add-form";

const useStyles = makeStyles(theme => ({
    paper: {
        [theme.breakpoints.up("sm")]: {
            height: "20vw",
            width: "20vw",
            margin: "1rem auto 1rem auto",
        },
        [theme.breakpoints.down("sm")]: {
            height: "30vw",
            width: "30vw",
            margin: "1rem auto 1rem auto",
        },
        [theme.breakpoints.down("xs")]: {
            height: "48vw",
            width: "48vw",
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
    const [anchorElAdd, setAnchorElAdd] = React.useState(null);
    const [size, setSize] = React.useState(null);
    const measureRef = React.createRef();

    const handleClickAdd = (event) => {
        window.document.querySelector('.app').style.overflowY = "hidden";
        setAnchorElAdd(measureRef.current);
        if (measureRef.current.getBoundingClientRect().top - document.querySelector('.app > header').getBoundingClientRect().height < 0) {
            document.querySelector('.app').scrollTo(0, 0);
        }
    };

    const handleCloseAdd = () => {
        window.document.querySelector('.app').style.overflowY = "scroll";
        setAnchorElAdd(null);
    };

    const openAdd = Boolean(anchorElAdd);
    const idAdd = openAdd ? `${name}-add-value` : undefined;

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

    useEffect(() => {
        if (measureRef.current !== null) {
            setSize(measureRef.current.clientHeight);
            window.addEventListener('resize', () => {
                if (measureRef.current !== null) {
                    setSize(measureRef.current.clientHeight);
                }
            });
        }
    }, [measureRef]);

    return (
        <Grid item xs={6} sm={4} lg={3}>
            <Paper className={classes.paper}>
                {!measure.loading ?
                    <Grid
                        container
                        direction="column"
                        className={classes.container}
                        ref={measureRef}
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
                                            className={classes.root} onClick={handleClickAdd}>
                                    <FontAwesomeIcon icon={faPlus}/>
                                </IconButton>
                                <AddFormWithRef unit={unit} name={shortName}
                                                defaultValue={measure.last ? measure.last.value : 0} open={openAdd}
                                                handleClose={handleCloseAdd} anchorEl={anchorElAdd} id={idAdd}
                                                size={size}
                                />
                            </Grid>
                        </Grid>
                </Grid>
                    : <Skeleton height="100%" animation="wave" variant="rect"/>}
            </Paper>
        </Grid>
    )
};