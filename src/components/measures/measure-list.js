import React, {useContext, useEffect, useState} from "react";
import {Loading} from "../common/loading";
import {tankContext} from "../../contexts/tank-context";
import {typeContext} from "../../contexts/type-context";
import List from "./list";
import {authContext} from "../../contexts/auth-context";
import {alertContext} from "../../contexts/alert-context";
import {appFetch, GET} from "../../utils/app-fetch";

export const MeasureList = () => {
    const {tank} = useContext(tankContext);
    const {type} = useContext(typeContext);
    const {auth} = useContext(authContext);
    const {setAlert} = useContext(alertContext);

    const [measures, setMeasures] = useState({data: [], loading: true});
    const [page, setPage] = useState(0);
    const [totalMeasures, setTotalMeasures] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = React.useState('desc');
    const [orderBy, setOrderBy] = React.useState('createdAt');
    const [update, setUpdate] = React.useState(false);

    useEffect(() => {
        if (update) {
            getMeasures();
            setUpdate(false);
        }
    }, [update]);

    useEffect(() => {
        getMeasures()
    }, [tank, page, rowsPerPage, order, orderBy]);

    const getMeasures = () => {
        setMeasures({data: [], loading: true});
        appFetch(
            GET,
            `measures?tank=${tank.data.id}&limit=${rowsPerPage}&page=${page + 1}&sort=${orderBy},${order === "desc" ? "DESC" : "ASC"}&type=${type.data.type}`,
            null,
            auth.token,
            (result) => {
                setMeasures({
                    data: result.data,
                    loading: false
                });
                setTotalMeasures(result.total)
            },
            () => (setMeasures({data: [], loading: true}))
        );
    };

    return (
        <Loading loading={type.loading}>
            <List
                type={type}
                page={page}
                setPage={setPage}
                setRowsPerPage={setRowsPerPage}
                rowsPerPage={rowsPerPage}
                total={totalMeasures}
                data={measures}
                setOrder={setOrder}
                setOrderBy={setOrderBy}
                order={order}
                orderBy={orderBy}
                setUpdate={setUpdate}/>
        </Loading>
    )
};