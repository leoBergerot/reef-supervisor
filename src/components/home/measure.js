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
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import {typeContext} from "../../contexts/type-context";
import Divider from "@material-ui/core/Divider";
import {appFetch, GET} from "../../utils/app-fetch";
import {useTranslation} from "react-i18next";

Number.prototype.round = function (places) {
    return +(Math.round(this + "e+" + places) + "e-" + places);
};

const useStyles = makeStyles(theme => ({
    paper: {
        [theme.breakpoints.up("md")]: {
            height: "25vw",
            width: "25vw",
            margin: "1rem auto 1rem auto",
        },
        [theme.breakpoints.up("lg")]: {
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
    increase:{
        height: "inherit",
        [theme.breakpoints.down("xs")]: {
            fontSize: "0.7rem"
        },
        [theme.breakpoints.up("sm")]: {
            fontSize: "0.73rem"
        },
        [theme.breakpoints.up("md")]: {
            fontSize: "1rem"
        },
    },
    percentageIncrease:{
        height: "min-content",
        [theme.breakpoints.down("xs")]: {
            fontSize: "0.5rem",
            marginLeft: "2px",

        },
        [theme.breakpoints.up("sm")]: {
            marginLeft: "2px",
            fontSize: "0.53rem"
        },
        [theme.breakpoints.up("md")]: {
            fontSize: "0.8rem",
            marginLeft: "5px",

        },
        [theme.breakpoints.up("lg")]: {
            marginLeft: "10px",
        },

    }
}));

export const Measure = ({name, shortName, unit, type, history}) => {
    const {getAuthToken} = useContext(authContext);
    const {tank} = useContext(tankContext);
    const {setTypeData} = useContext(typeContext);
    const {setAlert} = useContext(alertContext);
    const {t} = useTranslation();
    const classes = useStyles();

    const [measure, setMeasure] = useState({last: null, previous: null, loading: true});
    const [anchorElAdd, setAnchorElAdd] = React.useState(null);
    const [anchorElMenu, setAnchorElMenu] = React.useState(null);
    const [size, setSize] = React.useState(null);
    const measureRef = React.createRef();

    const handleClickAdd = (event) => {
        window.document.querySelector('main').style.overflowY = "hidden";
        setAnchorElAdd(measureRef.current);
        if (measureRef.current.getBoundingClientRect().top - document.querySelector('header').getBoundingClientRect().height < 0) {
            document.querySelector('main').scrollTo(0, (window.document.querySelector('main').scrollTop + measureRef.current.getBoundingClientRect().top) - document.querySelector('header').getBoundingClientRect().height);
        }
    };

    const handleCloseAdd = () => {
        window.document.querySelector('main').style.overflowY = "scroll";
        setAnchorElAdd(null);
    };

    const handleClickMenu = (event) => {
        setAnchorElMenu(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorElMenu(null);
    };

    const handleShowList = () => {
        setTypeData({name, shortName, unit, type});
        history.push("/measures")
    };

    const handleShowGraphic = () => {
        setTypeData({name, shortName, unit, type});
        history.push("/chart")
    };

    const openAdd = Boolean(anchorElAdd);
    const idAdd = openAdd ? `${name}-add-value` : undefined;

    const getMeasureByTypeAndTank = () => {
        setMeasure({last: null, previous: null, loading: true});
        appFetch(
            GET,
            `measures?tank=${tank.data.id}&limit=2&sort=createdAt,DESC&type=${type}`,
            null,
            getAuthToken(),
            (result) => {
                setMeasure({
                    last: (result.length >= 0 ? result[0] : null),
                    previous: (result.length >= 1 ? result[1] : null),
                    loading: false
                });
            },
            () => {
                setMeasure({last: null, previous: null, loading: true});
            },
            setAlert
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
                                {t(`measure.parameter.${name}`)} {shortName && `(${shortName})`}
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
                                <IconButton color="primary"
                                            aria-label={t('measure.menu.aria', {name: t(`measure.parameter.${name}`)})}
                                            className={classes.root} onClick={handleClickMenu}>
                                    <FontAwesomeIcon icon={faEllipsisV}/>
                                </IconButton>
                                <Menu
                                    id={`menu-measure-${name}`}
                                    anchorEl={anchorElMenu}
                                    keepMounted
                                    open={Boolean(anchorElMenu)}
                                    marginThreshold={0}
                                    onClose={handleCloseMenu}
                                >
                                    <MenuItem disabled><Typography variant="subtitle2"
                                                                   align="center">{t('measure.menu.title', {name: t(`measure.parameter.${name}`)})}</Typography></MenuItem>
                                    <Divider/>
                                    <MenuItem onClick={handleShowList}>{t('measure.menu.edit')}</MenuItem>
                                    <MenuItem onClick={handleShowGraphic}>{t('measure.menu.show_chart')}</MenuItem>
                                </Menu>
                                {measure.previous && (
                                    <div align="center" style={{
                                        position: "absolute",
                                        alignItems: "center",
                                        display: "flex",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                    }}>
                                        <Typography variant={"subtitle2"} className={classes.increase} style={{
                                            color: measure.last.value >= measure.previous.value ? "green" : "red"
                                        }}>
                                            {`${measure.last.value >= measure.previous.value ? "+" : ""}${(measure.last.value - measure.previous.value).round(2)} ${unit}`}
                                        </Typography>
                                        <Typography variant="caption" className={classes.percentageIncrease}>
                                            {measure.previous.value > 0 ? `(${measure.last.value >= measure.previous.value ? "+" : ""}${(((measure.last.value - measure.previous.value).round(3) / measure.previous.value).round(3) * 100).round(2)} %)` : ""}
                                        </Typography>
                                    </div>
                                )}
                                <IconButton color="primary"
                                            aria-label={t('measure.add', {name: t(`measure.parameter.${name}`)})}
                                            className={classes.root} onClick={handleClickAdd}>
                                    <FontAwesomeIcon icon={faPlus}/>
                                </IconButton>
                                <AddFormWithRef unit={unit}
                                                measure={measure}
                                                setMeasure={setMeasure}
                                                name={shortName}
                                                defaultValue={measure.last ? measure.last.value.toString() : "0"}
                                                open={openAdd}
                                                handleClose={handleCloseAdd} anchorEl={anchorElAdd} id={idAdd}
                                                size={size}
                                                type={type}
                                />
                            </Grid>
                        </Grid>
                </Grid>
                    : <Skeleton height="100%" animation="wave" variant="rect"/>}
            </Paper>
        </Grid>
    )
};