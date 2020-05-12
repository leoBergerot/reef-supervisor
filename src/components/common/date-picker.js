import {DesktopDateTimePicker} from "@material-ui/pickers";
import React from "react";
import {makeStyles} from "@material-ui/core/styles";
import {useTranslation} from "react-i18next";

const useStyle = makeStyles(() => ({
    small: {
        '& input': {
            fontSize: '0.875rem',
            width: '12ch',
            padding: 0
        },
        '& button': {
            padding: 0,
            margin: 0,
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translate(110%, -50%)"
        },
        '& svg': {
            fontSize: '1rem',
        },
        '& > div': {
            display: 'block',
            margin: 0
        },
        ' & label': {
            display: 'none'
        },
        ' & p': {
            width: '14ch',
        }
    }
}));
export const DatePicker = ({selectedDate, handleDateChange, small, onError, error, helperText}) => {

    const classes = useStyle();
    const {t} = useTranslation();

    return (
        <DesktopDateTimePicker
            className={small ? classes.small : ""}
            disableFuture
            ampm={false}
            inputFormat="DD/MM/YY HH:mm"
            mask="__/__/__ __:__"
            label={t("measure.inputs.date")}
            okLabel="Ok"
            cancelLabel="Cancel"
            onError={onError}
            error={error}
            helperText={helperText}
            value={selectedDate}
            onChange={handleDateChange}
        />
    );
};