import React, {useEffect, useState} from "react";
import {Header} from "../common/header";
import Grid from "@material-ui/core/Grid";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {Measure} from "./measure";
import CircularProgress from "@material-ui/core/CircularProgress";

const useStyles = makeStyles((theme) => ({
    root: {
        overflow: "scroll",
        position: "absolute",
        [theme.breakpoints.up("xs")]: {
            padding: "1rem"
        },
        [theme.breakpoints.down("xs")]: {
            padding: "1rem 0 1rem 0"
        },
        [theme.breakpoints.down("sm")]: {
            top: "56px"
        },
        [theme.breakpoints.up("sm")]: {
            top: "64px"
        },
    },
    loading: {
        position: "absolute",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        [theme.breakpoints.down("sm")]: {
            top: "56px",
            height: "calc(100% - 56px)"
        },
        [theme.breakpoints.up("sm")]: {
            top: "64px",
            height: "calc(100% - 64px)"
        }
    }
}));

export const Home = ({history}) => {
    const classes = useStyles();
    const parameters = [{shortName: "KH", name: "Water hardness", unit: "°KH"}, {
        shortName: "MG",
        name: "Magnesium",
        unit: "mg/l"
    }, {shortName: "CA", name: "Calcium", unit: "mg/l"}, {
        shortName: "MG",
        name: "Magnesium",
        unit: "mg/l"
    }, {shortName: "NO3", name: "Nitrate", unit: "mg/l"}, {
        shortName: "MG",
        name: "Magnesium",
        unit: "mg/l"
    }, {shortName: "°C", name: "Temperature", unit: "°C"}];

    const [types, setTypes] = useState({loading: true, data: null});

    useEffect(() => {

    }, []);
    return(
    <>
        <Header history={history}>
        </Header>
        {types.loading ?
            <div className={classes.loading}>
                <CircularProgress/>
            </div>
            :
            <div className={classes.root}>
            <Grid container>
                {parameters.map((value, index) => (
                    <Measure key={index} name={value.name} shortName={value.shortName} unit={value.unit}/>
                ))}
            </Grid>
            </div>}
    </>
    )
};