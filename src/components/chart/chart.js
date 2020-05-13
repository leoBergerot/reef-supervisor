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
import {MuiPickersContext} from "@material-ui/pickers";
import {ArgumentAxis, Chart as ChartDevExpress, LineSeries, ValueAxis} from '@devexpress/dx-react-chart-material-ui';
import Skeleton from "@material-ui/lab/Skeleton";
import {ArgumentScale, ValueScale} from "@devexpress/dx-react-chart";
import {DateRangePicker} from "../common/date-range-picker";
import {appFetch, GET} from "../../utils/app-fetch";
import {useTranslation} from "react-i18next";
import {scaleTime} from 'd3-scale';
import {timeDay, timeHour, timeMinute, timeMonth, timeSecond, timeWeek, timeYear} from "d3-time";
import {timeFormatDefaultLocale} from "d3-time-format";

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
            height: "100% !important",
            "& #bottom-axis-container text": {
                [theme.breakpoints.down("xs")]: {
                    fontSize: '0.4rem'
                },
            }
        }
    }));

export const Chart = () => {
    const {moment} = useContext(MuiPickersContext);
    const {tank} = useContext(tankContext);
    const {type} = useContext(typeContext);
    const {getAuthToken} = useContext(authContext);
    const {setAlert} = useContext(alertContext);
    const {i18n, t} = useTranslation();

    const [selectedDate, handleDateChange] = React.useState([moment().subtract(1, 'months'), moment()]);
    const [measures, setMeasures] = useState({data: [], loading: true});

    const classes = useStyle();

    const timeLocal = timeFormatDefaultLocale(i18n.language.substring(0, 2) === 'fr' ?
        {
            dateTime: "%x, %X",
            date: "%-d/%-m/%Y",
            time: "%-I:%M:%S",
            periods: ["Matin", "Après midi"],
            days: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
            shortDays: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
            months: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"],
            shortMonths: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jui", "Jul", "Au", "Sep", "Oct", "Nov", "Dec"]
        } : {
            dateTime: "%x, %X",
            date: "%-m/%-d/%Y",
            time: "%-I:%M:%S %p",
            periods: ["AM", "PM"],
            days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            shortDays: ["Sun", "Mon", "Mar", "Wed", "Thu", "Fri", "Sat"],
            months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        });

    const formatMillisecond = timeLocal.format(".%L"),
        formatSecond = timeLocal.format(":%S"),
        formatMinute = timeLocal.format(i18n.language.substring(0, 2) === 'fr' ? "%H:%M" : "%I:%M"),
        formatHour = timeLocal.format(i18n.language.substring(0, 2) === 'fr' ? "%Hh" : "%I%p"),
        formatDay = timeLocal.format("%a %d"),
        formatWeek = timeLocal.format("%b %d"),
        formatMonth = timeLocal.format("%B"),
        formatYear = timeLocal.format("%Y");

    useEffect(() => {
        getMeasures()
    }, [tank, selectedDate]);

    const getMeasures = () => {
        setMeasures({data: [], loading: true});
        appFetch(
            GET,
            `measures?tank=${tank.data.id}&sort=createdAt,ASC&type=${type.data.type}&filter=createdAt||gte||${selectedDate[0].format("Y-MM-DD")}&filter=createdAt||lte||${moment(selectedDate[1], "Y-MM-DD").add(1, 'days').format("Y-MM-DD")}`,
            null,
            getAuthToken(),
                (result) => {
                    setMeasures({
                        data: result.map((value) => {
                            let date = moment(value.createdAt);
                            return ({
                            value: value.value,
                                createdAt: new Date(date.format('YYYY'), date.format('MM') - 1, date.format('DD'), date.format('HH'), date.format('mm'))
                            })
                        }),
                        loading: false
                    });
                },
            () => {
                    setMeasures({data: [], loading: true});
            },
            setAlert
        )
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
                        {t('chart.title', {name: t(`measure.parameter.${type.data.name}`)})}
                    </Typography>
                    <DateRangePicker selectedDate={selectedDate} handleDateChange={handleDateChange}
                                     disabled={measures.loading}/>
                </Toolbar>
                <Paper className={classes.paper}>
                    {!measures.loading ?
                        <ChartDevExpress
                            data={measures.data}
                            className={classes.chart}
                        >
                            <ArgumentScale factory={scaleTime}/>
                            <ValueScale modifyDomain={getDomain}/>
                            <ArgumentAxis className={classes.argument} tickFormat={(scale) => (
                                scale.tickFormat = (date) => (
                                    timeSecond(date) < date ? formatMillisecond
                                        : timeMinute(date) < date ? formatSecond
                                        : timeHour(date) < date ? formatMinute
                                            : timeDay(date) < date ? formatHour
                                                : timeMonth(date) < date ? (timeWeek(date) < date ? formatDay : formatWeek)
                                                    : timeYear(date) < date ? formatMonth
                                                        : formatYear)(date)
                            )}/>
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