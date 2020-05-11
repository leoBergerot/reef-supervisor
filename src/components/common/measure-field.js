import React from "react";
import TextField from "@material-ui/core/TextField/TextField";
import NumberFormat from "react-number-format";
import {makeStyles} from "@material-ui/core/styles";


const useStyle = makeStyles(theme => ({
    small: {
        '& input': {
            fontSize: '0.875rem',
            padding: 0
        },
    }
}));
export const MeasureField = ({small, ...rest}) => {
    const classes = useStyle(rest);
    return (
        <TextField
            {...rest}
            className={small ? classes.small : ''}
            InputProps={{
                inputComponent: NumberFormatCustom,
            }}
        />
    )
};

function NumberFormatCustom(props) {
    const {inputRef, onChange, placeholder, ...other} = props;
    return (
        <NumberFormat
            {...other}
            getInputRef={inputRef}
            onValueChange={(value) => {
                onChange({
                    target: {
                        name: props.name,
                        value: value.value,
                    },
                });
            }}
            allowNegative={false}
            thousandSeparator=" "
            decimalScale={4}
            inputMode="decimal"
            allowedDecimalSeparators={[',', '.']}
            suffix={` ${placeholder}`}
        />
    );
}
