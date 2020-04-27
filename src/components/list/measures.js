import React, {useContext, useEffect, useState} from "react";
import {Main} from "../common/main";
import Grid from "@material-ui/core/Grid";
import {tankContext} from "../../contexts/tank-context";
import {typeContext} from "../../contexts/type-context";
import EnhancedTable from "./table";
import {authContext} from "../../contexts/auth-context";
import {alertContext} from "../../contexts/alert-context";

export const Measures = () => {
    const {tank} = useContext(tankContext);
    const {type} = useContext(typeContext);
    const {auth} = useContext(authContext);
    const {setAlert} = useContext(alertContext);


    const [measures, setMeasures] = useState({data: [], loading: true});
    const [page, setPage] = useState(0);
    const [totalMeasures, setTotalMeasures] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [order, setOrder] = React.useState('desc');
    const [orderBy, setOrderBy] = React.useState('createdAt');


    useEffect(() => {
        getMeasures()
    }, [tank, page, rowsPerPage, order, orderBy]);

    const getMeasures = () => {
        setMeasures({data: [], loading: true});
        fetch(`${process.env.REACT_APP_API_URL}/measures?tank=${tank.data.id}&limit=${rowsPerPage}&page=${page + 1}&sort=${orderBy},${order === "desc" ? "DESC" : "ASC"}&type=${type.data.type}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + auth.token
            },
        })
            .then(res => res.json())
            .then(
                (result) => {
                    setMeasures({
                        data: result.data,
                        loading: false
                    });
                    setTotalMeasures(result.total)
                },
                (error) => {
                    setMeasures({data: [], loading: true});
                    setAlert({
                        open: true,
                        message: `An error occurred`,
                        severity: 'error'
                    });
                }
            );
    };

    return (
        <Main loading={type.loading}>
            <Grid container style={{height:"100%"}}>
                <Grid item xs={12} style={{position: "relative", height:"inherit"}}>
                    <EnhancedTable type={type} page={page} setPage={setPage} setRowsPerPage={setRowsPerPage}
                                   rowsPerPage={rowsPerPage} total={totalMeasures} data={measures} setOrder={setOrder}
                                   setOrderBy={setOrderBy} order={order} orderBy={orderBy}/>
                </Grid>
            </Grid>
        </Main>
    )
};