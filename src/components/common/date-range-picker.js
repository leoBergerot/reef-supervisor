import {makeStyles} from "@material-ui/core/styles";
import {MobileDateRangePicker} from "@material-ui/pickers";
import React from "react";

const pickerStyle = makeStyles((theme) => ({
    root: {
        flexDirection: "row",
        marginLeft: "auto"
    }
}));

export const DateRangePicker = ({selectedDate, handleDateChange, disabled}) => {
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