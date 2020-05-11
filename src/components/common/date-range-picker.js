import {makeStyles} from "@material-ui/core/styles";
import {MobileDateRangePicker} from "@material-ui/pickers";
import React from "react";
import {useTranslation} from "react-i18next";

const pickerStyle = makeStyles((theme) => ({
    root: {
        flexDirection: "row",
        marginLeft: "auto"
    }
}));

export const DateRangePicker = ({selectedDate, handleDateChange, disabled}) => {
    const classes = pickerStyle();
    const {t} = useTranslation();

    return (
        <MobileDateRangePicker
            disabled={disabled}
            className={classes.root}
            startText={t('date_picker_range.start_date')}
            endText={t('date_picker_range.end_date')}
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