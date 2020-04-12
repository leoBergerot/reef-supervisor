import React, {useContext, useEffect, useState} from "react";
import {GridContainerResponsive} from "../common/grid-container-reponsive";
import {Card} from "./card";
import {makeStyles} from "@material-ui/core/styles";
import {AddButton} from "./add-button";
import {authContext} from "../../contexts/auth-context";
import {alertContext} from "../../contexts/alert-context";
import {CircularProgress} from "@material-ui/core";
import {TypographyResponsive} from "../common/typography-responsive";

const useStyles = makeStyles((theme) => ({
    list: {
        maxWidth: "80%",
    },
    listTank: {
        display: "flex",
        flexWrap: "inherit",
        alignContent: "center",
        justifyContent: "center",
        [theme.breakpoints.up("sm")]: {
            margin: '2em 0',
        },
        [theme.breakpoints.down("sm")]: {
            margin: '1em 0',
        }
    },
    typography: {
        textAlign: "center",
        [theme.breakpoints.up("sm")]: {
            fontSize: '4vw !important'
        },
        [theme.breakpoints.down("sm")]: {
            fontSize: '7vw'
        }
    }
}));

export const List = () => {
    const {auth} = useContext(authContext);
    const {setAlert} = useContext(alertContext);

    const [tankList, setTankList] = useState({loading: true, data: []});
    useEffect(() => {
        fetch(process.env.REACT_APP_API_URL + '/tanks', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + auth.token
            },
        })
            .then(res => res.json())
            .then(
                (result) => {
                    setTankList({data: result, loading: false});
                },
                (error) => {
                    setTankList({loading: false, data: []});
                    setAlert({
                        open: true,
                        message: `An error occurred`,
                        severity: 'error'
                    });
                }
            );

    }, []);

    const classes = useStyles();
    return (
        <GridContainerResponsive fullHeightSmall>
            {!tankList.loading ?
                <div className={classes.list}>
                    <TypographyResponsive overrideClasses={{root: classes.typography}}>
                        Choice your tank :
                    </TypographyResponsive>
                    <div className={classes.listTank}>
                        {tankList.data.map((tank) => (
                            <Card name={tank.name}/>
                        ))}
                        <AddButton/>
                    </div>
                </div>
                : <CircularProgress/>}

        </GridContainerResponsive>
    )
};