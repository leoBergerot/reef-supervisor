import React, {useContext, useEffect, useState} from "react";
import {tankContext} from "../../contexts/tank-context";
import {typeContext} from "../../contexts/type-context";
import {authContext} from "../../contexts/auth-context";
import {alertContext} from "../../contexts/alert-context";
import {Loading} from "../common/loading";
import Paper from "@material-ui/core/Paper";
import {makeStyles} from "@material-ui/core/styles";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import {MobileDateRangePicker, MuiPickersContext} from "@material-ui/pickers";
import {ArgumentAxis, Chart as ChartDevExpress, LineSeries, ValueAxis} from '@devexpress/dx-react-chart-material-ui';
import Skeleton from "@material-ui/lab/Skeleton";
import {ValueScale} from "@devexpress/dx-react-chart";

const data = [
    {createdAt: "hola", value: 10},
    {createdAt: "helo", value: 20},
    {createdAt: "helo", value: 30},
];

const useStyle = makeStyles((theme) =>
    ({
        root: {
            width: '100%',
            height: "100%",
            position: "relative",
            display: "flex",
            flexDirection: "column"
        },
        title: {
            width: "maxContent",
            flex: '1 1 auto',
        },
        toolbar: {
            flexWrap: "wrap",
            minHeight: "min-content"
        },
        paper: {
            height: "100%",
            margin: "16px",
            overflow: "scroll"
        },
        chart: {
            height: "100% !important"
        }
    }));

const pickerStyle = makeStyles((theme) => ({
    root: {
        flexDirection: "row",
        marginLeft: "auto"
    }
}));

const BasicDateRangePicker = ({selectedDate, handleDateChange, disabled}) => {
    const classes = pickerStyle();

    return (
        <MobileDateRangePicker
            disabled={disabled}
            className={classes.root}
            startText="Start date"
            endText="End date"
            inputFormat="DD/MM/YY"
            mask="__/__/__"
            disableFuture
            value={selectedDate}
            onChange={date => {
                handleDateChange(date)
            }}
        />
    );
};

export const Chart = () => {
    const {moment} = useContext(MuiPickersContext);
    const {tank} = useContext(tankContext);
    const {type} = useContext(typeContext);
    const {auth} = useContext(authContext);
    const {setAlert} = useContext(alertContext);

    const [selectedDate, handleDateChange] = React.useState([moment().subtract(1, 'months'), moment()]);
    const [measures, setMeasures] = useState({data: [], loading: true});

    const classes = useStyle();

    useEffect(() => {
        getMeasures()
    }, [tank, selectedDate]);

    const getMeasures = () => {
        setMeasures({data: [], loading: true});
        fetch(`${process.env.REACT_APP_API_URL}/measures?tank=${tank.data.id}&sort=createdAt,ASC&type=${type.data.type}&filter=createdAt||gte||${selectedDate[0].format("Y-MM-DD")}&filter=createdAt||lte||${moment(selectedDate[1], "Y-MM-DD").add('days', 1).format("Y-MM-DD")}`, {
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
                        data: result.map((value) => ({
                            value: value.value,
                            createdAt: moment(value.createdAt).format("DD/MM/YY HH:mm:ss")
                        })),
                        loading: false
                    });
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
    const getDomain = (domain) => {
        if (domain[0] / 10 < 1) {
            return [(domain[0] - 0.5) < 0 ? domain[0] : domain[0] - 0.5, domain[1] + 0.5]
        } else if (domain[0] / 100 < 10) {
            return [domain[0] - 5, domain[1] + 5]
        } else if (domain[0] / 1000 < 10) {
            return [domain[0] - 10, domain[1] + 10]
        } else {
            return [domain[0] - 50, domain[1] + 50]
        }

    };
    return (
        <Loading loading={type.loading}>
            <Paper variant="elevation" className={classes.root}>
                <Toolbar className={classes.toolbar}>
                    <Typography variant="overline" className={classes.title} gutterBottom>
                        {type.data.name} values graphic
                    </Typography>
                    <BasicDateRangePicker selectedDate={selectedDate} handleDateChange={handleDateChange}
                                          disabled={measures.loading}/>
                </Toolbar>
                <Paper className={classes.paper}>
                    {!measures.loading ?
                        <ChartDevExpress
                            data={measures.data}
                            className={classes.chart}
                        >
                            <ValueScale modifyDomain={getDomain}/>
                            <ArgumentAxis showLabels={false} showTick={false}/>
                            <ValueAxis/>
                            <LineSeries valueField="value" argumentField="createdAt"/>
                        </ ChartDevExpress>
                        :
                        <Skeleton height="100%" variant="rect"/>
                    }
                </Paper>
            </Paper>
        </Loading>
    )
};