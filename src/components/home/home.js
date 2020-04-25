import React, {useContext, useEffect, useState} from "react";
import {Header} from "../common/header";
import Grid from "@material-ui/core/Grid";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {Measure} from "./measure";
import CircularProgress from "@material-ui/core/CircularProgress";
import {authContext} from "../../contexts/auth-context";
import {alertContext} from "../../contexts/alert-context";

const useStyles = makeStyles((theme) => ({
    root: {
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
    const {auth} = useContext(authContext);
    const {setAlert} = useContext(alertContext);
    const [types, setTypes] = useState({loading: true, data: null});

    useEffect(() => {
        fetch(process.env.REACT_APP_API_URL + '/measure-types', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + auth.token
            },
        })
            .then(res => res.json())
            .then(
                (result) => {
                    setTypes({data: result, loading: false});
                },
                (error) => {
                    setTypes({loading: false, data: []});
                    setAlert({
                        open: true,
                        message: `An error occurred`,
                        severity: 'error'
                    });
                }
            );
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
                {!types.loading && types.data.map((value, index) => (
                    <Measure key={index} name={value.name} shortName={value.shortName} unit={value.unit} type={value.id}/>
                ))}
            </Grid>
            </div>}
    </>
    )
};