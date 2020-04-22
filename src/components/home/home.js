import React from "react";
import {Header} from "../common/header";
import Grid from "@material-ui/core/Grid";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {Measure} from "./measure";

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
        [theme.breakpoints.up("sm")]: {
            top: "64px"
        },
        [theme.breakpoints.down("sm")]: {
            top: "56px"
        },
    },
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
    return(
    <>
        <Header history={history}>
        </Header>
        <div className={classes.root}>
            <Grid container>
                {parameters.map((value, index) => (
                    <Measure key={index} name={value.name} shortName={value.shortName} unit={value.unit}/>
                ))}
            </Grid>
        </div>
    </>
    )
};