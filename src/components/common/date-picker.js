import {DesktopDateTimePicker} from "@material-ui/pickers";
import React from "react";

export const DatePicker = ({selectedDate, handleDateChange}) => {

    return (
        <DesktopDateTimePicker
            disableFuture
            ampm={false}
            inputFormat="DD/MM/YY HH:mm"
            mask="__/__/__ __:__"
            label="Date"
            okLabel="Ok"
            cancelLabel="Cancel"
            value={selectedDate}
            onChange={handleDateChange}
        />
    );
};