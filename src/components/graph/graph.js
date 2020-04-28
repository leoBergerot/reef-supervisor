import React, {useContext} from "react";
import {tankContext} from "../../contexts/tank-context";
import {typeContext} from "../../contexts/type-context";
import {authContext} from "../../contexts/auth-context";
import {alertContext} from "../../contexts/alert-context";
import {Loading} from "../common/loading";
import Paper from "@material-ui/core/Paper";
import {makeStyles} from "@material-ui/core/styles";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";

const useStyle = makeStyles((theme) =>
    ({
        root: {
            width: '100%',
            height: "100%",
            position: "relative",
        },
        title: {
            flex: '1 1 100%',
        }
    }));

export const Graph = () => {
    const {tank} = useContext(tankContext);
    const {type} = useContext(typeContext);
    const {auth} = useContext(authContext);
    const {setAlert} = useContext(alertContext);

    const classes = useStyle();

    return (
        <Loading loading={type.loading}>
            <Paper variant="elevation" className={classes.root}>
                <Toolbar>
                    <Typography variant="overline" className={classes.title}>
                        {type.data.name} values graphic
                    </Typography>
                </Toolbar>
            </Paper>
        </Loading>
    )
};