import React, {useContext, useEffect, useState} from "react";
import Grid from "@material-ui/core/Grid";
import {Measure} from "./measure";
import {authContext} from "../../contexts/auth-context";
import {alertContext} from "../../contexts/alert-context";
import {Loading} from "../common/loading";
import {appFetch, GET} from "../../utils/app-fetch";

export const Home = ({history}) => {
    const {auth} = useContext(authContext);
    const {setAlert} = useContext(alertContext);
    const [types, setTypes] = useState({loading: true, data: null});

    useEffect(() => {
        appFetch(
            GET,
            'measure-types',
            null,
            auth.token,
            (result) => {
                setTypes({data: result, loading: false});
            },
            () => {
                setTypes({data: null, loading: false});
            },
            setAlert
        );
    }, []);

    return(
        <Loading history={history} loading={types.loading}>
            <Grid container>
                {!types.loading && types.data.map((value, index) => (
                    <Measure history={history} key={index} name={value.name} shortName={value.shortName}
                             unit={value.unit} type={value.id}/>
                ))}
            </Grid>
        </Loading>
    )
};