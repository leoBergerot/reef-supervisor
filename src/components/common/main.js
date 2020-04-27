import React from "react";
import makeStyles from "@material-ui/core/styles/makeStyles";
import CircularProgress from "@material-ui/core/CircularProgress/CircularProgress";

const useStyles = makeStyles((theme) => ({
    loading: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%"
    }
}));

export const Main = ({children, loading}) => {

    const classes = useStyles();

    return (
        <>
                {loading ?
                    <div className={classes.loading}>
                        <CircularProgress/>
                    </div> :
                    children
                }
        </>
    )
};