import React, {useContext, useEffect, useState} from "react";
import Grid from "@material-ui/core/Grid";
import {Measure} from "./measure";
import {authContext} from "../../contexts/auth-context";
import {alertContext} from "../../contexts/alert-context";
import {Main} from "../common/main";

export const Home = ({history}) => {
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
        <Main history={history} loading={types.loading}>
            <Grid container>
                {!types.loading && types.data.map((value, index) => (
                    <Measure history={history} key={index} name={value.name} shortName={value.shortName}
                             unit={value.unit} type={value.id}/>
                ))}
            </Grid>
        </Main>
    )
};